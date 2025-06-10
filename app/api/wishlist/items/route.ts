import { NextResponse, NextRequest } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabaseClient";
import { Product, SessionUser, WishlistItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // 1. Find or create the user's wishlist
    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (wishlistError && wishlistError.code !== "PGRST116") { // PGRST116: single row not found
      console.error("Error finding user wishlist:", wishlistError);
      return NextResponse.json({ error: "Error accessing wishlist" }, { status: 500 });
    }

    let wishlistId: string;
    if (!wishlist) {
      // Create a new wishlist for the user
      const { data: newWishlist, error: newWishlistError } = await supabase
        .from("wishlists")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (newWishlistError || !newWishlist) {
        console.error("Error creating wishlist:", newWishlistError);
        return NextResponse.json({ error: "Could not create wishlist" }, { status: 500 });
      }
      wishlistId = newWishlist.id;
    } else {
      wishlistId = wishlist.id;
    }

    // 2. Check if the item already exists in the wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", wishlistId)
      .eq("product_id", productId)
      .maybeSingle(); // Use maybeSingle to avoid error if no item found

    if (checkError) {
      console.error("Error checking for existing wishlist item:", checkError);
      return NextResponse.json({ error: "Error adding to wishlist" }, { status: 500 });
    }

    if (existingItem) {
      return NextResponse.json({ message: "Item already in wishlist" }, { status: 409 }); // 409 Conflict
    }

    // 3. Add the new item to the wishlist_items table
    const { data: newItemData, error: addItemError } = await supabase
      .from("wishlist_items")
      .insert({ wishlist_id: wishlistId, product_id: productId })
      .select(`
        id,
        added_at,
        product_id,
        product:products(*)
      `)
      .single();

    if (addItemError || !newItemData) {
      console.error("Error adding item to wishlist (during insert/select operation):", addItemError);
      return NextResponse.json({ error: "Could not add item to wishlist or retrieve its details after insert" }, { status: 500 });
    }
    
    // Linter suggests newItemData.product might be an array. Handle this defensively.
    const productDataField = newItemData.product as unknown as Product[] | Product | null | undefined;
    let productDetail: Product | null = null;

    if (Array.isArray(productDataField) && productDataField.length > 0) {
      productDetail = productDataField[0];
    } else if (productDataField && !Array.isArray(productDataField)) {
      // If it's not an array but is an object (Product), use it directly.
      productDetail = productDataField as Product;
    }

    // Check if productDetail is null, or if it's an object, ensure it has an id.
    if (!productDetail || typeof productDetail.id === 'undefined') { 
        console.error(
            "Product details missing or invalid in newItemData.product after insert. productId used for insert:", 
            productId, 
            "Actual value of newItemData.product from Supabase:", 
            JSON.stringify(newItemData.product, null, 2) // Log the actual structure for debugging
        );
        return NextResponse.json({ 
            error: "Failed to retrieve valid product details from joined data. This could be due to RLS on the 'products' table, the product not existing, or an issue with the data join itself." 
        }, { status: 500 });
    }

    const addedWishlistItem: WishlistItem = {
        id: newItemData.id,
        wishlist_id: wishlistId, // Include wishlist_id as per updated WishlistItem type
        product_id: newItemData.product_id,
        product: productDetail as Product, // productDetail is now a single Product or null
        added_at: newItemData.added_at,
    };

    return NextResponse.json(addedWishlistItem, { status: 201 });

  } catch (error) {
    console.error("Unexpected error adding item to wishlist:", error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
} 