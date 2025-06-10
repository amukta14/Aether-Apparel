import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Order } from '@/lib/types'; // Assuming Order type is in lib/types.ts

// Define the shape of the product info coming from the joined 'products' table
interface SupabaseProductInfo {
  name: string;
  images: Array<{ url: string; alt?: string }> | null;
}

// Define the shape of the item coming from Supabase, including the joined product(s)
interface SupabaseOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products: SupabaseProductInfo[] | null; // products is an array or null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Fetch the order
    const { data: orderData, error: orderError } = await supabase
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
        updated_at
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      if (orderError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }

    if (!orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items for the order
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_purchase,
        products ( name, images )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      // Decide if you want to return partial data or an error
      // For now, we'll return the order data without items if items fetch fails
    }
    
    // Transform data to match the Order and OrderItem interfaces
    const order: Order = {
      id: orderData.id,
      userId: orderData.user_id,
      totalAmount: orderData.total_amount,
      status: orderData.status,
      shippingAddress: orderData.shipping_address, // Assuming it's a JSON string, parse if necessary
      paymentMethod: orderData.payment_method_dummy,
      paymentId: orderData.payment_id_dummy,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      items: itemsData ? itemsData.map((item: SupabaseOrderItem) => {
        // If products is an array, take the first element, otherwise null
        const productInfo = item.products && item.products.length > 0 ? item.products[0] : null;

        return {
          id: item.id,
          orderId: orderData.id,
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price_at_purchase,
          product: productInfo ? {
              name: productInfo.name,
              imageUrl: productInfo.images && productInfo.images.length > 0 ? productInfo.images[0].url : undefined
          } : undefined
        };
      }) : []
    };
    
    // If shipping_address is stored as a JSON object and needs parsing:
    // try {
    //   order.shippingAddress = JSON.parse(orderData.shipping_address_json_text_column);
    // } catch (e) {
    //   console.error("Failed to parse shipping address", e);
    //   // Handle error or leave as string
    // }


    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 