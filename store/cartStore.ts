import { create } from 'zustand';
import { Product } from '../lib/types'; 
// import toast from 'react-hot-toast'; // Import if you want to use toasts here

// localStorage key
const GUEST_CART_STORAGE_KEY = 'auraDecorGuestCart';

// This ClientCartItem should match the structure returned by GET /api/cart
// It includes the full product details and the price at which it was added.
export interface ClientCartItem {
  id: string; // Typically product_id, used as a key for the item in the cart array
  product_id: string; // Foreign key to the product
  product: Product; // The full product object
  quantity: number;
  price_at_addition: number; // Price of the product when it was added to cart
}

// Data structure for merging cart items
export interface CartItemForMerge {
  productId: string;
  quantity: number;
  priceAtAddition: number;
}

interface CartState {
  items: ClientCartItem[];
  isLoading: boolean;
  error: string | null;
  isGuestCartActive: boolean; // New state to track if the cart is local (guest)
  initializeCart: (isAuthenticated: boolean) => Promise<void>;
  addItemToCart: (product: Product, quantity: number) => Promise<void>; // Will be async
  removeItemFromCart: (productId: string) => Promise<void>; // Will be async
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>; // Will be async
  clearCart: () => Promise<void>; // Will be async
  getCartTotal: () => number;
  getItemCount: () => number;
  mergeGuestCartWithServer: () => Promise<void>; // New method to merge guest cart
  // New internal helper to explicitly set guest cart (e.g., on logout)
  activateGuestCart: () => void; 
}

// Helper functions for localStorage
const saveGuestCartToLocalStorage = (items: ClientCartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Could not save guest cart to localStorage", e);
    }
  }
};

const loadGuestCartFromLocalStorage = (): ClientCartItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (storedCart) {
        return JSON.parse(storedCart);
      }
    } catch (e) {
      console.error("Could not load guest cart from localStorage", e);
      // localStorage.removeItem(GUEST_CART_STORAGE_KEY); // Clear corrupted data
    }
  }
  return [];
};

const clearGuestCartFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch (e) {
      console.error("Could not clear guest cart from localStorage", e);
    }
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  isGuestCartActive: false, // Default to false

  initializeCart: async (isAuthenticated: boolean) => {
    // console.log('Initializing cart...'); // For debugging
    set({ isLoading: true, error: null });
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/cart'); // GET request by default
        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in or session expired, clear local cart
            // console.log('User not authenticated, clearing local cart.'); // For debugging
            set({ items: [], isLoading: false, isGuestCartActive: true }); // Activate guest cart
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch cart from server');
        }
        const data: ClientCartItem[] = await response.json();
        // console.log('Cart data fetched from server:', data); // For debugging
        set({ items: data, isLoading: false, isGuestCartActive: false }); // Deactivate guest cart on successful fetch
        clearGuestCartFromLocalStorage(); // Clean up any old guest cart
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred while fetching cart';
        console.error("Error initializing cart for authenticated user:", err);
        set({ isLoading: false, error: message, isGuestCartActive: false }); // Remain in non-guest mode
      }
    } else {
      // Not authenticated, initialize as guest cart
      const guestItems = loadGuestCartFromLocalStorage();
      set({ items: guestItems, isLoading: false, isGuestCartActive: true });
    }
  },

  activateGuestCart: () => {
    // Explicitly activates guest mode and loads from localStorage.
    // Useful for logout scenarios or initial load if session status is known to be unauthenticated.
    const guestItems = loadGuestCartFromLocalStorage();
    set({ items: guestItems, isLoading: false, isGuestCartActive: true, error: null });
  },

  addItemToCart: async (product: Product, quantity: number) => {
    if (get().isGuestCartActive) {
      set(state => {
        const currentItems = state.items;
        const existingItemIndex = currentItems.findIndex(item => item.product_id === product.id);
        let updatedItems;
        if (existingItemIndex > -1) {
          updatedItems = currentItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: ClientCartItem = {
            id: product.id,
            product_id: product.id,
            product: product,
            quantity: quantity,
            price_at_addition: product.price,
          };
          updatedItems = [...currentItems, newItem];
        }
        saveGuestCartToLocalStorage(updatedItems);
        return { items: updatedItems, isLoading: false };
      });
      return;
    }

    // Authenticated user logic (existing)
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item to cart');
      }
      // const addedItem = await response.json(); // API returns the added/updated cart_item
      // Instead of trying to merge, just refetch the whole cart for consistency
      await get().initializeCart(true); 
      // toast.success(`${product.name} added to cart`); // Toast can be handled in the component calling this
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add item to cart.';
      console.error("Error adding item to cart:", err);
      set({ isLoading: false, error: message });
      // toast.error(message);
    }
  },

  updateItemQuantity: async (productId: string, quantity: number) => {
    if (get().isGuestCartActive) {
      set(state => {
        let updatedItems;
        if (quantity <= 0) {
          updatedItems = state.items.filter(item => item.product_id !== productId);
        } else {
          updatedItems = state.items.map(item =>
            item.product_id === productId ? { ...item, quantity } : item
          );
        }
        saveGuestCartToLocalStorage(updatedItems);
        return { items: updatedItems, isLoading: false };
      });
      return;
    }

    // Authenticated user logic (existing)
    set({ isLoading: true, error: null });
    try {
      if (quantity <= 0) { // For authenticated user, 0 or less means remove
        return get().removeItemFromCart(productId);
      }
      const response = await fetch(`/api/cart/items/${productId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update item quantity');
      }
      await get().initializeCart(true);
      // toast.success(`Quantity updated`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update item quantity.';
      console.error("Error updating item quantity:", err);
      set({ isLoading: false, error: message });
      // toast.error(message);
    }
  },

  removeItemFromCart: async (productId: string) => {
    if (get().isGuestCartActive) {
      set(state => {
        const updatedItems = state.items.filter(item => item.product_id !== productId);
        saveGuestCartToLocalStorage(updatedItems);
        return { items: updatedItems, isLoading: false };
      });
      return;
    }

    // Authenticated user logic (existing)
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item from cart');
      }
      await get().initializeCart(true);
      // toast.success(`Item removed from cart`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove item from cart.';
      console.error("Error removing item from cart:", err);
      set({ isLoading: false, error: message });
      // toast.error(message);
    }
  },

  clearCart: async () => {
    if (get().isGuestCartActive) {
      set({ items: [], isLoading: false, error: null });
      saveGuestCartToLocalStorage([]); // Save empty array
      return;
    }

    // Authenticated user logic (existing)
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear cart');
      }
      // API returns a success message, initializeCart will fetch empty items []
      await get().initializeCart(true); 
      // toast.success('Cart cleared');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not clear cart.';
      console.error("Error clearing cart:", err);
      set({ isLoading: false, error: message });
      // toast.error(message);
    }
  },

  mergeGuestCartWithServer: async () => {
    const guestItems = get().items;
    const isGuest = get().isGuestCartActive;

    if (!isGuest || guestItems.length === 0) {
      // If not a guest cart or cart is empty, no need to merge.
      // Ensure isGuestCartActive is false if user might be logged in now.
      // This will be handled by initializeCart if called after login.
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const itemsToMerge: CartItemForMerge[] = guestItems.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        priceAtAddition: item.price_at_addition,
      }));

      const response = await fetch('/api/cart/merge', { // New API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToMerge }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to merge guest cart with server');
      }
      
      // Crucial: Mark that it's no longer a guest cart session *before* initializing
      // because initializeCart might still hit 401 if session isn't fully established yet by caller.
      // However, successful merge implies user is now authenticated for this operation.
      // The subsequent initializeCart should then fetch the user's *actual* server cart.
      clearGuestCartFromLocalStorage();
      set({ isGuestCartActive: false }); 
      await get().initializeCart(true); // Fetches the merged cart from server & confirms auth status

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not merge guest cart.';
      console.error("Error merging guest cart:", err);
      set({ isLoading: false, error: message });
      // If merge fails, the cart remains a guest cart with its items.
      // User might need to try logging in again or manual intervention.
    }
  },

  getCartTotal: () => {
    // Ensure price_at_addition is used if available, otherwise fallback to product.price
    return get().items.reduce((total, item) => total + (item.price_at_addition || item.product.price) * item.quantity, 0);
  },
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  }
}));

// How to use initializeCart:
// In a relevant part of your application, likely where you manage sessions or app initialization:
// import { useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import { useCartStore } from '@/store/cartStore';
// 
// const MyComponentOrLayout = () => {
//   const { data: session, status } = useSession();
//   const initializeCart = useCartStore((state) => state.initializeCart);
//   const cartItems = useCartStore((state) => state.items); // For debugging or re-render trigger
// 
//   useEffect(() => {
//     if (status === 'authenticated') {
//       console.log('User authenticated, initializing cart store...');
//       initializeCart();
//     } else if (status === 'unauthenticated') {
//       // Optionally clear cart explicitly or rely on initializeCart to handle 401
//       console.log('User not authenticated, cart should be empty or cleared.');
//       initializeCart(); // Will clear items if 401 is returned
//     }
//   }, [status, initializeCart]);
// 
//   return (/* ... */);
// };
