import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth'; // Correct import for Session type
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { ClientCartItem } from '@/store/cartStore';
import { SessionUser } from '@/lib/types'; // Import SessionUser

// Define a type for the product data expected from the DB
// This should align with your products table and what cart items need
interface ProductForCart {
  id: string;
  name: string;
  price: number;
  images: { url: string; alt?: string }[] | null;
  // Add other fields if needed by the cart display, e.g., stock_quantity
  stock_quantity: number | null;
}

export async function GET() {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Now session.user is typed as SessionUser, so session.user.id is known
  const userId = session.user.id;

  try {
    // 1. Find the user's cart
    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single(); // Assuming one active cart per user for now

    if (cartError && cartError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ message: 'Error fetching cart', error: cartError.message }, { status: 500 });
    }

    if (!cartData) {
      // No cart found for the user, return empty cart
      return NextResponse.json([], { status: 200 });
    }

    const cartId = cartData.id;

    // 2. Fetch cart items with product details
    const { data: cartItemsData, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        price_at_addition,
        product_id,
        products:product_id (
          id,
          name,
          price,
          images,
          stock_quantity
        )
      `)
      .eq('cart_id', cartId);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return NextResponse.json({ message: 'Error fetching cart items', error: itemsError.message }, { status: 500 });
    }

    if (!cartItemsData) {
      return NextResponse.json([], { status: 200 });
    }
    
    const clientCartItems: ClientCartItem[] = cartItemsData.map(item => {
      const product = item.products as unknown as ProductForCart | null;
      if (!product) {
        console.warn(`Product data missing for cart item with product_id: ${item.product_id}`);
        return null; 
      }
      return {
        id: product.id, 
        product_id: item.product_id,
        product: {
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            description: null, 
            stock_quantity: product.stock_quantity,
        },
        quantity: item.quantity,
        price_at_addition: item.price_at_addition,
      };
    }).filter(item => item !== null) as ClientCartItem[];

    return NextResponse.json(clientCartItems, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in GET /api/cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { productId, quantity } = await request.json();

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ message: 'Invalid request body. productId and positive quantity are required.' }, { status: 400 });
    }

    // 1. Find or create the user's cart
    const { data: cartData, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error finding cart:', cartError);
      return NextResponse.json({ message: 'Error accessing cart', error: cartError.message }, { status: 500 });
    }

    let cartId: string;
    if (!cartData) {
      // Create a new cart for the user
      const { data: newCartData, error: newCartError } = await supabase
        .from('cart')
        .insert({ user_id: userId })
        .select('id')
        .single();
      
      if (newCartError || !newCartData) {
        console.error('Error creating cart:', newCartError);
        return NextResponse.json({ message: 'Error creating cart', error: newCartError?.message }, { status: 500 });
      }
      cartId = newCartData.id;
    } else {
      cartId = cartData.id;
    }

    // 2. Fetch product details (especially price for price_at_addition)
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, price, stock_quantity')
      .eq('id', productId)
      .single();

    if (productError || !productData) {
      console.error('Error fetching product:', productError);
      return NextResponse.json({ message: productError?.code === 'PGRST116' ? 'Product not found' : 'Error fetching product', error: productError?.message }, { status: productError?.code === 'PGRST116' ? 404 : 500 });
    }

    // Optional: Check stock if you want to prevent adding more than available
    // if (productData.stock_quantity !== null && quantity > productData.stock_quantity) {
    //   return NextResponse.json({ message: 'Not enough stock available' }, { status: 400 });
    // }

    // 3. Check if item already exists in cart_items
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Error checking for existing cart item:', existingItemError);
      return NextResponse.json({ message: 'Error checking cart item', error: existingItemError.message }, { status: 500 });
    }

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      // Optional: Check stock for updated quantity
      // if (productData.stock_quantity !== null && newQuantity > productData.stock_quantity) {
      //   return NextResponse.json({ message: 'Not enough stock for updated quantity' }, { status: 400 });
      // }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, price_at_addition: productData.price }) // Also update price_at_addition in case it changed
        .eq('id', existingItem.id)
        .select('*') // Select what you want to return
        .single();

      if (updateError || !updatedItem) {
        console.error('Error updating cart item:', updateError);
        return NextResponse.json({ message: 'Error updating cart item', error: updateError?.message }, { status: 500 });
      }
      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Add new item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: quantity,
          price_at_addition: productData.price, // Store current price
        })
        .select('*') // Select what you want to return
        .single();
      
      if (insertError || !newItem) {
        console.error('Error adding item to cart:', insertError);
        return NextResponse.json({ message: 'Error adding item to cart', error: insertError?.message }, { status: 500 });
      }
      return NextResponse.json(newItem, { status: 201 }); // 201 Created
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/cart:', error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

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

    if (cartError && cartError.code !== 'PGRST116') { // Error other than not found
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ message: 'Error fetching cart', error: cartError.message }, { status: 500 });
    }

    if (!cartData) {
      // No cart to clear
      return NextResponse.json({ message: 'Cart not found or already empty' }, { status: 404 });
    }

    const cartId = cartData.id;

    // 2. Delete all items from cart_items associated with this cart_id
    const { error: deleteItemsError, count } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (deleteItemsError) {
      console.error('Error clearing cart items:', deleteItemsError);
      return NextResponse.json({ message: 'Error clearing cart items', error: deleteItemsError.message }, { status: 500 });
    }

    // Optional: Delete the cart record itself from 'cart' table if it's now empty and you prefer that.
    // const { error: deleteCartError } = await supabase
    //   .from('cart')
    //   .delete()
    //   .eq('id', cartId);
    // if (deleteCartError) {
    //   console.warn('Error deleting cart record after clearing items:', deleteCartError);
    //   // Not returning error here as items are cleared, which is the main goal.
    // }

    return NextResponse.json({ message: `Cart cleared successfully. ${count} items removed.` }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 