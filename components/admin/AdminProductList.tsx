'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

// Interface for product data (should match the one in app/admin/page.tsx or a shared type)
interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity?: number | null;
  category?: string | null;
  images?: { url: string; alt?: string }[] | null;
}

interface AdminProductListProps {
  initialProducts: Product[];
}

export default function AdminProductList({ initialProducts }: AdminProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update products if initialProducts prop changes (e.g., after a full page refresh elsewhere)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      setSuccessMessage(`Product "${productName}" deleted successfully.`);
      // Update the local state to remove the deleted product
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      // Optionally, you might want to refresh data from server if pagination/sorting is complex:
      // router.refresh(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting product:', errorMessage);
    }
  };

  if (products.length === 0 && initialProducts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No products found.</p>;
  }
   if (products.length === 0 && initialProducts.length > 0) {
    // This case can happen if all products are deleted on the client-side
    return <p className="text-center text-muted-foreground py-8">All products have been deleted. Add new products or refresh.</p>;
  }

  return (
    <>
      {error && <p className="mb-4 p-3 text-sm text-destructive-foreground bg-destructive/20 border border-destructive rounded-md">Error: {error}</p>}
      {successMessage && <p className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900 dark:text-green-200">{successMessage}</p>}
      
      <div className="overflow-x-auto shadow-md rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Image</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground hidden sm:table-cell">
                  {product.images && product.images.length > 0 && product.images[0].url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      width={40}
                      height={40}
                      className="object-cover rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; /* Hide on error */ }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      No Img
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-card-foreground">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                  {product.category ?? 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden sm:table-cell">
                  {product.stock_quantity ?? 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link href={`/admin/products/${product.id}/edit`} passHref>
                    <Button 
                      size="sm" 
                      variant="outline"
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
} 