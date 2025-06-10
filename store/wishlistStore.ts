import { create } from 'zustand';
import { WishlistItem } from '@/lib/types'; // Assuming Product might be needed for function signatures
import toast from 'react-hot-toast';
import { getSession } from 'next-auth/react'; // Added import

export interface WishlistState {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isProductInWishlist: (productId: string) => boolean;
  clearLocalWishlist: () => void;
  // Helper to set items, internal or for hydration if needed
  setWishlistItems: (items: WishlistItem[]) => void; 
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistItems: [],
  isLoading: false,
  error: null,

  setWishlistItems: (items: WishlistItem[]) => {
    set({ wishlistItems: items, isLoading: false, error: null });
  },

  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch wishlist');
      }
      const items: WishlistItem[] = await response.json();
      set({ wishlistItems: items, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Error fetching wishlist:", errorMessage);
      set({ isLoading: false, error: errorMessage });
      // toast.error(`Error fetching wishlist: ${errorMessage}`); // Optional: direct toast
    }
  },

  addToWishlist: async (productId: string) => {
    const session = await getSession(); // Check session

    if (!session) {
      toast.error("Please log in to add items to your wishlist.");
      set({ isLoading: false }); // Reset loading state
      return;
    }

    set({ isLoading: true, error: null });
    const currentItems = get().wishlistItems;
    // Optimistic update: check if product already exists by product_id
    if (currentItems.some(item => item.product?.id === productId)) {
        // console.log("Item already in wishlist (client-side check).");
        // toast.success("Item already in wishlist!"); // Or some other notification
        set({ isLoading: false }); // Reset loading 
        return; // Do not proceed if item already exists based on product ID
    }

    try {
      const response = await fetch('/api/wishlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle 409 Conflict (already exists) specifically if needed
        if (response.status === 409) {
            toast.error(errorData.message || 'Item already in wishlist (server check).');
             // Fetch wishlist to ensure consistency if server says it exists but client didn't think so
            await get().fetchWishlist(); 
        } else {
            throw new Error(errorData.error || 'Failed to add item to wishlist');
        }
        set({ isLoading: false, error: errorData.message || 'Failed to add item' });
        return;
      }

      const addedItem: WishlistItem = await response.json();
      // Add the new item returned by the API to the state
      set((state) => ({
        wishlistItems: [...state.wishlistItems, addedItem],
        isLoading: false,
      }));
      toast.success(addedItem.product?.name ? `${addedItem.product.name} added to wishlist!` : 'Item added to wishlist!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Error adding to wishlist:", errorMessage);
      set({ isLoading: false, error: errorMessage });
      toast.error(`Error: ${errorMessage}`);
    }
  },

  removeFromWishlist: async (productId: string) => {
    set({ isLoading: true, error: null });
    // Optimistic update idea: remove immediately from UI
    // const originalItems = get().wishlistItems;
    // set(state => ({ 
    //   wishlistItems: state.wishlistItems.filter(item => item.product?.id !== productId)
    // }));

    try {
      const response = await fetch(`/api/wishlist/items/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        // set({ wishlistItems: originalItems, isLoading: false, error: errorData.error || 'Failed to remove item' }); // Revert optimistic update
        throw new Error(errorData.error || 'Failed to remove item from wishlist');
      }

      // If DELETE is successful, API returns a success message or 204. 
      // We filter the item out from the local state.
      const removedItem = get().wishlistItems.find(item => item.product?.id === productId);
      set((state) => ({
        wishlistItems: state.wishlistItems.filter(item => item.product?.id !== productId),
        isLoading: false,
      }));
      toast.success(removedItem?.product?.name ? `${removedItem.product.name} removed from wishlist.` : 'Item removed from wishlist.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Error removing from wishlist:", errorMessage);
      set({ isLoading: false, error: errorMessage });
      toast.error(`Error: ${errorMessage}`);
      // set({ wishlistItems: originalItems }); // Revert optimistic update if it was implemented
    }
  },

  isProductInWishlist: (productId: string) => {
    return get().wishlistItems.some(item => item.product?.id === productId);
  },

  clearLocalWishlist: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guest-wishlist');
    }
    set({ wishlistItems: [] });
    // toast.success('Wishlist cleared locally.'); // Removed this toast
  },
})); 