import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabaseClient";
import { Product, SessionUser } from "@/lib/types";

// This local WishlistItem is what this route should ultimately return per item.
// It includes wishlist_id which might not be in AppWishlistItem from lib/types yet.
interface ReturnedWishlistItem {
  id: string;
  wishlist_id: string; 
  product_id: string;
  product: Product;
  added_at: string;
}

// Type for the raw item fetched from Supabase, before product processing
interface DbWishlistItem {
  id: string;
  added_at: string;
  product_id: string;
  // product can be Product, Product[], or null/undefined from the join
  product: Product | Product[] | null | undefined; 
}

export async function GET() {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (wishlistError && wishlistError.code !== "PGRST116") {
      console.error("Error fetching wishlist:", wishlistError);
      return NextResponse.json(
        { error: "Failed to fetch wishlist details" },
        { status: 500 }
      );
    }

    if (!wishlist) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch wishlist items with aliased product details
    const { data: wishlistItemsData, error: itemsError } = await supabase
      .from("wishlist_items")
      .select(`
        id,
        added_at,
        product_id,
        product:products(*)
      `)
      .eq("wishlist_id", wishlist.id)
      .order("added_at", { ascending: false });

    if (itemsError) {
      console.error("Error fetching wishlist items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch wishlist items" },
        { status: 500 }
      );
    }
    
    // Type from Supabase might be an array or single object for joined relations.
    const itemsFromDb: DbWishlistItem[] = wishlistItemsData || [];

    const formattedWishlistItems: ReturnedWishlistItem[] = itemsFromDb.map((itemFromDb) => {
      let productDetail: Product | null = null;
      const productDataField = itemFromDb.product;

      if (Array.isArray(productDataField) && productDataField.length > 0) {
        productDetail = productDataField[0]; // Already Product type from DbWishlistItem definition
      } else if (productDataField && !Array.isArray(productDataField)) {
        productDetail = productDataField as Product; // It's a single Product object
      }
      
      if (!productDetail || typeof productDetail.id === 'undefined') {
        console.warn(
          `Wishlist item ${itemFromDb.id} (product_id: ${itemFromDb.product_id}) is missing valid product details. ` +
          `Actual value of itemFromDb.product: ${JSON.stringify(itemFromDb.product, null, 2)}`
        );
        return null; 
      }

      return {
        id: itemFromDb.id,
        wishlist_id: wishlist.id, 
        product_id: itemFromDb.product_id,
        product: productDetail,
        added_at: itemFromDb.added_at,
      };
    }).filter(Boolean) as ReturnedWishlistItem[];

    return NextResponse.json(formattedWishlistItems, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching wishlist:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 