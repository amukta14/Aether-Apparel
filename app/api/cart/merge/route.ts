import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as necessary

// This interface should match the one in your cartStore.ts or a shared types file
interface CartItemForMerge {
  productId: string;
  quantity: number;
  priceAtAddition: number;
}

interface RequestBody {
  items: CartItemForMerge[];
}

export async function POST(req: NextRequest) {
  // Ensure your session callback in NextAuth options populates user.id
  const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string } }; // Adjusted type for session.user

  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let requestBody: RequestBody;
  try {
    requestBody = await req.json();
  } catch (err) { // Changed variable name to err and will log it
    console.error('Invalid request body JSON:', err);
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const { items } = requestBody;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ message: 'Missing or invalid items array' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ message: 'No items to merge' }, { status: 200 });
  }

  // Validate each item structure (basic validation)
  for (const item of items) {
    if (
      typeof item.productId !== 'string' ||
      typeof item.quantity !== 'number' ||
      item.quantity <= 0 || // Quantities should be positive
      typeof item.priceAtAddition !== 'number'
    ) {
      return NextResponse.json({ message: 'Invalid item structure in array' }, { status: 400 });
    }
  }

  try {
    const { error: rpcError } = await supabase.rpc('merge_cart_items', {
      p_user_id: userId,
      p_items: items, // Supabase client will serialize this to JSONB
    });

    if (rpcError) {
      console.error('Supabase RPC error merging cart:', rpcError);
      console.error('Supabase RPC error details:', JSON.stringify(rpcError, null, 2));
      return NextResponse.json(
        { message: 'Failed to merge cart items', details: rpcError.message, code: rpcError.code, hint: rpcError.hint },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Cart merged successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error merging cart:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json(
        { message: 'An unexpected server error occurred', details: errorMessage },
        { status: 500 }
    );
  }
} 