export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface User {
  id: string; // UUID
  name?: string | null;
  email: string;
  role?: string | null; // e.g., 'user', 'admin'
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// If you created a 'profiles' table linked to auth.users instead:
// export interface Profile {
//   id: string; // UUID, FK to auth.users.id
//   name?: string | null;
//   role?: string | null;
//   created_at?: string;
//   updated_at?: string;
// }

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductColorOption {
  name: string;
  hex?: string; // e.g., '#FF0000'
  availability?: 'in_stock' | 'out_of_stock' | 'low_stock';
}

export interface Product {
  id: string; // UUID
  name: string;
  description?: string | null;
  price: number; // DECIMAL(10, 2)
  sku?: string | null;
  stock_quantity?: number | null;
  images?: ProductImage[] | null; // JSONB
  category?: string | null; // e.g., 'Living Room', 'Bedroom'
  tags?: string[] | null; // TEXT ARRAY
  is_featured?: boolean | null;
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

export interface Cart {
  id: string; // UUID
  user_id?: string | null; // FK to users.id or profiles.id
  session_id?: string | null; // For guest carts
  created_at?: string; // TIMESTAMPTZ
  // Potentially include cart_items directly if fetching joined data
  // items?: CartItem[]; 
}

export interface CartItem {
  id: string; // UUID
  cart_id: string; // FK to cart.id
  product_id: string; // FK to products.id
  quantity: number;
  price_at_addition: number; // DECIMAL(10, 2), price when added
  added_at?: string; // TIMESTAMPTZ
  // Potentially include product details if fetching joined data
  // product?: Product; 
}

export interface Wishlist {
  id: string; // UUID
  user_id: string; // FK to users.id or profiles.id
  created_at?: string; // TIMESTAMPTZ
  // items?: WishlistItem[];
}

export interface WishlistItem {
  id: string; // UUID
  wishlist_id: string; // FK to wishlists.id
  product_id: string; // FK to products.id
  added_at?: string; // TIMESTAMPTZ
  product?: Product; // Uncommented to include product details
}

export interface ShippingAddress {
  recipient_name?: string | null;
  street: string;
  apartment_suite?: string | null;
  city: string;
  state_province?: string | null;
  postal_code: string;
  country: string;
  phone_number?: string | null;
}

export type OrderStatus = 
  | 'pending' 
  | 'awaiting_payment' 
  | 'awaiting_fulfillment' 
  | 'awaiting_shipment' 
  | 'awaiting_pickup' 
  | 'partially_shipped'
  | 'shipped' 
  | 'completed' // e.g., delivered
  | 'cancelled' 
  | 'declined' 
  | 'refunded' 
  | 'partially_refunded'
  | 'disputed';

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  shippingAddress: string; // Assuming this is a string, could be a structured object
  paymentMethod: string; // Renamed from payment_method_dummy for clarity
  paymentId?: string; // Renamed from payment_id_dummy, optional
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  items?: OrderItem[]; // Optional: if you want to fetch order items along with the order
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number; // Price at the time of order
  // You might want to include product details here if not fetching separately
  // e.g., name, image
  product?: { // Optional: if you want to fetch product details along with order items
    name: string;
    imageUrl?: string;
  };
}

// Extend NextAuth User type for session
import { User as NextAuthUser } from 'next-auth';

export interface SessionUser extends NextAuthUser {
  id: string; // Ensure id is always string and present
  role?: string | null;
  // Add any other custom properties you want in the session user
} 