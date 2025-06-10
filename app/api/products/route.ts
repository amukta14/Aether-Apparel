import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Assuming your Supabase client is here

// Define an interface for the raw product data from Supabase
// to handle the 'images' JSONB and 'stock_quantity'
interface SupabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string; alt?: string }[] | null; // Matches your DB structure for images
  category: string | null;
  stock_quantity: number | null;
  // Add other fields from your Supabase 'products' table if needed
}

// Define the interface for the product data the frontend expects
interface FrontendProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null; // Single image URL for frontend display
  category: string | null;
  stock?: number | null; // Optional stock for frontend, map from stock_quantity
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, images, category, stock_quantity');

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      throw new Error(error.message);
    }

    const products: SupabaseProduct[] = data || [];

    // Map SupabaseProduct to FrontendProduct
    const frontendProducts: FrontendProduct[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      // Extract the first image URL, or null if no images
      image_url: product.images && product.images.length > 0 ? product.images[0].url : null,
      category: product.category,
      stock: product.stock_quantity,
    }));

    return NextResponse.json(frontendProducts);

  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/products:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching products';
    return NextResponse.json({ message: 'Error fetching products', error: errorMessage }, { status: 500 });
  }
} 