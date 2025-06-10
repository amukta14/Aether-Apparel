import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import authOptions
import { SessionUser } from "@/lib/types"; // Assuming SessionUser includes role
import { generatePlaceholderImage } from '@/lib/placeholderUtils'; // Import the new utility

async function isAdminRequest(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log("isAdminRequest: No session found.");
    return false;
  }

  const user = session.user as SessionUser; // Cast to your SessionUser type
  if (user.role !== 'admin') {
    console.log(`isAdminRequest: User role "${user.role}" is not admin.`);
    return false;
  }
  console.log("isAdminRequest: User is admin.");
  return true;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) { // Use the updated admin check
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productData = await request.json();
    // Ensure image_urls is treated as an array, defaulting to empty if not provided or null
    const { name, description, price, stock_quantity, category, image_urls = [] } = productData;

    if (!name || !description || price === undefined || stock_quantity === undefined || !category) {
        return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    // Use ProductImage type for consistency and to match what generatePlaceholderImage returns
    const imagesToInsert: import('@/lib/types').ProductImage[] = []; 
    
    if (Array.isArray(image_urls) && image_urls.length > 0 && typeof image_urls[0] === 'string' && image_urls[0].trim() !== '') {
      // Ensure alt is always a string, even if name is somehow null/undefined at this point (though validated above)
      imagesToInsert.push({ url: image_urls[0], alt: name || "Product Image" }); 
    } else {
      // Use the utility function to generate placeholder
      const placeholder = generatePlaceholderImage(name);
      imagesToInsert.push(placeholder);
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name,
        description,
        price,
        stock_quantity,
        category,
        images: imagesToInsert // Use the transformed 'images' field
      }])
      .select();

    if (error) {
      console.error('Supabase error creating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ? data[0] : null, { status: 201 });
  } catch (error) {
    console.error('Error processing POST /api/admin/products:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 