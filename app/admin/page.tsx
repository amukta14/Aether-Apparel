import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { supabase } from "@/lib/supabaseClient";
import AdminProductList from '@/components/admin/AdminProductList'; // Import the new client component

// Interface for product data (shared with AdminProductList or defined in a common types file)
interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity?: number | null;
  category?: string | null;
  images?: { url: string; alt?: string }[] | null;
}

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock_quantity, category, images')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products for admin panel:", error);
    return []; 
  }
  return data as Product[] || []; 
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto p-4 md:p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Link href="/admin/orders" passHref>
            <Button variant="secondary">View Orders</Button>
          </Link>
          <Link href="/admin/products/new" passHref>
            <Button variant="secondary">Add New Product</Button>
          </Link>
        </div>
      </div>

      {/* Use the client component to display the product list and handle actions */}
      <AdminProductList initialProducts={products} />
      
    </div>
  );
} 