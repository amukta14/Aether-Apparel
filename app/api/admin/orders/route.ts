import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Order } from '@/lib/types';
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed

// Define a type for the raw order item from Supabase before transformation
interface RawSupabaseOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products: null | { // products can be null if join yields no result
    name: string;
    images: null | Array<{ url: string; alt?: string }>;
  };
}

// Define a type for the raw order from Supabase
interface RawSupabaseOrder {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method_dummy: string;
  payment_id_dummy?: string;
  created_at: string;
  updated_at: string;
  order_items: RawSupabaseOrderItem[] | null; // order_items can be null
}

export async function GET() { // Removed _request: NextRequest
  // TODO: Add admin role check using session
  // const session = await getServerSession(authOptions);
  // if (!session || session.user?.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // Explicitly type data from Supabase if possible, or cast
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        status,
        shipping_address,
        payment_method_dummy,
        payment_id_dummy,
        created_at,
        updated_at,
        order_items (
          id,
          product_id,
          quantity,
          price_at_purchase,
          products ( name, images )
        )
      `)
      .order('created_at', { ascending: false })
      .returns<RawSupabaseOrder[]>(); // Use .returns<T[]>() for type safety

    if (ordersError) {
      console.error('Error fetching orders for admin:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!ordersData) {
      return NextResponse.json([], { status: 200 });
    }

    const transformedOrders: Order[] = ordersData.map((order: RawSupabaseOrder) => ({
      id: order.id,
      userId: order.user_id,
      totalAmount: order.total_amount,
      status: order.status,
      shippingAddress: order.shipping_address,
      paymentMethod: order.payment_method_dummy,
      paymentId: order.payment_id_dummy,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: order.order_items ? order.order_items.map((item: RawSupabaseOrderItem) => ({
        id: item.id,
        orderId: order.id, // Add orderId to match OrderItem interface
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price_at_purchase,
        product: item.products ? {
          name: item.products.name,
          imageUrl: item.products.images && item.products.images.length > 0 ? item.products.images[0].url : undefined,
        } : undefined,
      })) : [],
    }));

    return NextResponse.json(transformedOrders, { status: 200 });
  } catch (error) {
    console.error('Admin orders route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 