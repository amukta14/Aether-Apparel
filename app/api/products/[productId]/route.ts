import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Define the context type for the route handler - removing this as it's unused
/*
interface ProductRouteContext {
  params: {
    productId: string;
  };
}
*/

export async function GET(_request: Request, { params: routeParams }: { params: { productId: string } }) {
  // The error suggests params might need to be awaited. Let's try to ensure it's resolved.
  // Renaming to routeParams to avoid confusion if we were to await the whole context object.
  const resolvedParams = await Promise.resolve(routeParams);
  const { productId } = resolvedParams;

  if (!productId) {
    return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*') // Select all columns for now. You might want to specify columns later.
      .eq('id', productId)
      .single(); // Fetches a single row

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "Not Found"
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
      console.error('Error fetching product:', error);
      return NextResponse.json({ message: 'Error fetching product', error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err: unknown) {
    console.error(`Unexpected error fetching product ${productId}:`, err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: 'Unexpected error fetching product', error: errorMessage }, { status: 500 });
  }
} 