import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { SessionUser } from '@/lib/types';
import { ClientCartItem } from '@/store/cartStore'; // Assuming this has product details needed

interface OrderPayload {
  items: ClientCartItem[];
  totalAmount: number;
  shippingDetails: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string; // e.g., 'credit_card', 'cash_on_delivery'
  // Add payment_id_dummy if you plan to send it from frontend for card payments
  paymentIdDummy?: string;
}

// GET - Fetch user's orders
export async function GET() {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        shipping_address,
        payment_method_dummy,
        payment_id_dummy,
        order_items (
          id,
          product_id,
          quantity,
          price_at_purchase,
          product_name_snapshot
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ message: 'Error fetching orders', error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders, { status: 200 });

  } catch (error) {
    console.error('Unexpected error fetching orders:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json() as OrderPayload;
    const { items, totalAmount, shippingDetails, paymentMethod, paymentIdDummy } = body;

    if (!items || items.length === 0 || !totalAmount || !shippingDetails || !paymentMethod) {
      return NextResponse.json({ message: 'Missing required order information' }, { status: 400 });
    }

    // 1. Create the order in the 'orders' table
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending', // Default status
        shipping_address: shippingDetails,
        payment_method_dummy: paymentMethod,
        payment_id_dummy: paymentMethod === 'credit_card' ? paymentIdDummy : null, // Only save if credit card
        // created_at and updated_at have defaults in DB
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ message: 'Could not create order', error: orderError?.message }, { status: 500 });
    }

    // 2. Create order items in 'order_items' table
    const orderItemsData = items.map(item => ({
      order_id: newOrder.id,
      product_id: item.product.id, // Assuming product_id is here from ClientCartItem
      quantity: item.quantity,
      price_at_purchase: item.product.price, // Or item.price_at_addition if you have it
      product_name_snapshot: item.product.name,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Potentially delete the created order if items fail to insert (rollback logic)
      await supabase.from('orders').delete().eq('id', newOrder.id);
      return NextResponse.json({ message: 'Could not create order items', error: itemsError.message }, { status: 500 });
    }

    // Consider clearing the user's cart from the database here if applicable
    // This depends on how your cart is fully managed (e.g., if it's tied to the user in DB)

    return NextResponse.json({ message: 'Order created successfully', orderId: newOrder.id, order: newOrder }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error creating order:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
} 