import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { SessionUser } from '@/lib/types';

interface RouteParams {
  params: {
    productId: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;
  const { productId } = params;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { quantity } = await request.json();

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ message: 'Invalid request: quantity must be a positive number.' }, { status: 400 });
    }

    // 1. Find the user's cart
    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError || !cartData) {
      console.error('Error fetching cart or cart not found:', cartError);
      return NextResponse.json({ message: cartError?.code === 'PGRST116' ? 'Cart not found' : 'Error fetching cart', error: cartError?.message }, { status: cartError?.code === 'PGRST116' ? 404 : 500 });
    }
    const cartId = cartData.id;

    // Optional: Fetch product details to check stock if necessary
    // const { data: productData, error: productError } = await supabase
    //   .from('products')
    //   .select('price, stock_quantity') // Fetch price if you need to update price_at_addition on quantity change
    //   .eq('id', productId)
    //   .single();
    // if (productError || !productData) {
    //   return NextResponse.json({ message: 'Product not found or error fetching product' }, { status: 404 });
    // }
    // if (productData.stock_quantity !== null && quantity > productData.stock_quantity) {
    //   return NextResponse.json({ message: 'Not enough stock available' }, { status: 400 });
    // }

    // 2. Update item quantity in cart_items
    // Note: You might want to update 'price_at_addition' if the product price can change and you want the latest price.
    // For simplicity here, we assume price_at_addition is set when the item is first added.
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity /*, price_at_addition: productData.price */ })
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .select('*') // Select what you want to return
      .single(); // Use single if you expect only one item to match

    if (updateError || !updatedItem) {
      console.error('Error updating cart item quantity:', updateError);
      // PGRST116 means no row was found to update, which implies item wasn't in cart for this product_id
      const itemNotFound = updateError?.code === 'PGRST116';
      return NextResponse.json(
        { message: itemNotFound ? 'Item not found in cart' : 'Error updating cart item quantity', error: updateError?.message }, 
        { status: itemNotFound ? 404 : 500 }
      );
    }

    return NextResponse.json(updatedItem, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in PUT /api/cart/items/[productId]:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;
  const { productId } = params;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Find the user's cart
    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError || !cartData) {
      console.error('Error fetching cart or cart not found:', cartError);
      return NextResponse.json({ message: cartError?.code === 'PGRST116' ? 'Cart not found' : 'Error fetching cart', error: cartError?.message }, { status: cartError?.code === 'PGRST116' ? 404 : 500 });
    }
    const cartId = cartData.id;

    // 2. Delete item from cart_items
    const { error: deleteError, count } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Error deleting cart item:', deleteError);
      return NextResponse.json({ message: 'Error deleting cart item', error: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      // This means the item was not found in the cart for this user and product
      return NextResponse.json({ message: 'Item not found in cart' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item removed from cart successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error('Unexpected error in DELETE /api/cart/items/[productId]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 