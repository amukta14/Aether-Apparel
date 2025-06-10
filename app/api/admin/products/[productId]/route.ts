import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Product, ProductImage } from '@/lib/types'; // Import the Product type and ProductImage
import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import authOptions
import { SessionUser } from "@/lib/types"; // Assuming SessionUser includes role
import { generatePlaceholderImage } from '@/lib/placeholderUtils'; // Import the new utility

// Old isAdmin placeholder removed

async function isAdminRequest(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.log("isAdminRequest: No session found.");
    return false;
  }
  const user = session.user as SessionUser;
  if (user.role !== 'admin') {
    console.log(`isAdminRequest: User role "${user.role}" is not admin.`);
    return false;
  }
  console.log("isAdminRequest: User is admin.");
  return true;
}

// RouteParams interface removed as it will be inlined

// Define a set of updatable fields for a Product
// Exclude 'id', 'created_at', 'updated_at' as they are typically managed by the DB or system
const updatableProductFields: (keyof Product)[] = [
  'name',
  'description',
  'price',
  'sku',
  'stock_quantity',
  'images',
  'category',
  'tags',
  'is_featured',
];

export async function PUT(request: NextRequest, { params }: { params: { productId: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const incomingData = await request.json() as Partial<Product & { image_urls?: string[] }>;

    const updateData: Partial<Product> = {};
    const productNameForAlt = incomingData.name; 

    // const placeholderColorSchemes = [...]; // This array is now in placeholderUtils

    // Handle image transformation and placeholder logic
    if (incomingData.hasOwnProperty('image_urls')) {
      const image_urls = Array.isArray(incomingData.image_urls) ? incomingData.image_urls : [];
      const imagesToUpdate: ProductImage[] = []; // Use ProductImage type
      
      if (image_urls.length > 0 && typeof image_urls[0] === 'string' && image_urls[0].trim() !== '') {
        // User provided a specific image URL. Ensure alt text has a fallback.
        imagesToUpdate.push({ url: image_urls[0], alt: productNameForAlt || 'Product image' });
      } else {
        // No specific image URL, or it was cleared by the user; generate/maintain placeholder
        // productNameForAlt is derived from incomingData.name, which should be present.
        const placeholder = generatePlaceholderImage(productNameForAlt);
        imagesToUpdate.push(placeholder);
      }
      updateData.images = imagesToUpdate; 
    }

    for (const k of updatableProductFields) {
      const key = k as keyof Product;
      // Skip 'images' if we handled it via 'image_urls', or if it wasn't in incomingData as 'image_urls'
      if (key === 'images' && incomingData.hasOwnProperty('image_urls')) {
        continue;
      }
      if (incomingData.hasOwnProperty(key) && incomingData[key] !== undefined) {
        // Casting to `any` here due to a persistent TypeScript inference issue with 
        // assigning to an indexed property on a Partial type when the key is a union.
        // The types `Product[typeof key]` and `(Product & { image_urls?: string[] })[typeof key]`
        // are otherwise compatible for any given `key: keyof Product` after the undefined check.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateData[key] = incomingData[key] as any;
      }
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update or no changes submitted' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData) // Supabase client should handle Partial<Product> correctly
      .eq('id', productId)
      .select();

    if (error) {
      console.error(`Supabase error updating product ${productId}:`, error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Product not found or no changes made' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Product not found after update (no data returned)' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error(`Error processing PUT /api/admin/products/${productId}:`, error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', productId);

    if (error) {
      console.error(`Supabase error deleting product ${productId}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error processing DELETE /api/admin/products/${productId}:`, error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 