"use client";

import React, { useEffect } from "react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { SessionUser, WishlistItem } from "@/lib/types";
import WishlistItemCard from "@/components/WishlistItemCard";
import { Heart } from "lucide-react";

const WishlistPage = () => {
  const { wishlistItems, fetchWishlist, removeFromWishlist, isLoading } = useWishlistStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const typedSessionUser = session?.user as SessionUser;
    if (status === "authenticated" && typedSessionUser?.id) {
      fetchWishlist();
    }
  }, [status, session, fetchWishlist]);

  const handleRemoveFromWishlist = async (productId: string) => {
    const typedSessionUser = session?.user as SessionUser;
    if (!typedSessionUser?.id) {
      toast.error("Please log in to manage your wishlist.");
      return;
    }
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error("Error removing item from wishlist (page component):", error);
      toast.error("Failed to remove item from wishlist.");
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center text-foreground bg-background min-h-[calc(100vh-var(--header-height,80px))]">Loading wishlist...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center bg-background min-h-[calc(100vh-var(--header-height,80px))]">
        <Heart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold text-foreground mb-4">Your Wishlist Awaits</h1>
        <p className="text-muted-foreground mb-8">Log in to see the items you&apos;ve saved for later.</p>
        <Button 
          size="lg" 
          onClick={() => router.push("/auth/login?callbackUrl=/wishlist")}
        >
          Log In to View Wishlist
        </Button>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-background min-h-[calc(100vh-var(--header-height,80px))]">
        <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-semibold text-foreground mb-6">Your Wishlist is Empty</h1>
        <p className="mb-4 text-lg text-muted-foreground">Looks like you haven&apos;t added any favorites yet.</p>
        <Button onClick={() => router.push("/products")}>Discover Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-muted min-h-[calc(100vh-var(--header-height,80px))]">
      <h1 className="text-3xl font-semibold text-foreground mb-8 text-center">Your Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistItems.map((item: WishlistItem) => {
          if (!item.product) return null;
          return (
            <WishlistItemCard 
              key={item.product.id} 
              product={item.product} 
              onRemove={() => handleRemoveFromWishlist(item.product!.id)} 
            />
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage; 