import { NextResponse, NextRequest } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabaseClient";
import { SessionUser } from "@/lib/types";

interface DeleteParams {
  params: {
    productId: string;
  };
}

export async function DELETE(
  request: NextRequest, // Can be _request if not used
  { params }: DeleteParams
) {
  const session = await getServerSession(authOptions) as (Session & { user: SessionUser }) | null;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { productId } = params;

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    // 1. Find the user's wishlist ID
    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (wishlistError && wishlistError.code !== "PGRST116") {
      console.error("Error fetching user wishlist for delete:", wishlistError);
      return NextResponse.json({ error: "Error accessing wishlist" }, { status: 500 });
    }

    if (!wishlist) {
      // No wishlist means the item cannot be in it.
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
    }

    const wishlistId = wishlist.id;

    // 2. Delete the item from wishlist_items
    // Use { count: 'exact' } to check if a row was actually deleted.
    const { error: deleteItemError, count } = await supabase
      .from("wishlist_items")
      .delete({ count: "exact" })
      .eq("wishlist_id", wishlistId)
      .eq("product_id", productId);

    if (deleteItemError) {
      console.error("Error deleting item from wishlist:", deleteItemError);
      return NextResponse.json(
        { error: "Could not remove item from wishlist" },
        { status: 500 }
      );
    }

    if (count === 0) {
      // If no rows were deleted, it means the item wasn't in the wishlist.
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
    }
    
    // Successfully deleted
    return NextResponse.json({ message: "Item removed from wishlist" }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error("Unexpected error deleting item from wishlist:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 