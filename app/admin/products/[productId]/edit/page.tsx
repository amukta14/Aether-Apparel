'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'next/navigation'; // Import useParams
import { Button } from '@/components/ui/Button';
import Link from 'next/link'; // Import Link
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft

// Define the Zod schema for product validation (can be reused or adapted from add product page)
const productSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  stock_quantity: z.coerce.number().int().min(0, { message: 'Stock must be a non-negative integer' }),
  category: z.enum([
    "Pants", "Tops", "Shirts", "Accessories", "Bottoms", 
    "Dresses", "Outerwear", "Footwear", "Activewear"
  ], { message: "Invalid category" }),
  image_url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')), // Single image URL for form simplicity
});

type ProductFormData = z.infer<typeof productSchema>;

const productCategories = [
  "Pants", "Tops", "Shirts", "Accessories", "Bottoms", 
  "Dresses", "Outerwear", "Footwear", "Activewear"
] as const;

// Interface for the product data fetched from the API
interface ProductData {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    stock_quantity: number;
    category: string;
    image_urls?: string[] | null; // API returns full product data
}

export default function EditProductPage() {
  // const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (productId) {
      setIsFetchingProduct(true);
      fetch(`/api/products/${productId}`)
        .then(res => {
          if (!res.ok) {
            // Try to parse error from API if available
            return res.json().then(errData => {
                throw new Error(errData.message || errData.error || 'Failed to fetch product details');
            }).catch(() => {
                throw new Error(`Failed to fetch product details. Status: ${res.status}`);
            });
          }
          return res.json();
        })
        .then((product: ProductData) => {
          // Prepare form data from product data
          const formData: ProductFormData = {
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.stock_quantity,
            category: product.category as ProductFormData['category'],
            image_url: product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : ''
          };
          reset(formData); // Pre-fill the entire form
          setIsFetchingProduct(false);
        })
        .catch(err => {
          setError('Failed to load product data: ' + (err instanceof Error ? err.message : String(err)));
          setIsFetchingProduct(false);
        });
    }
  }, [productId, reset]);

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Refactor payload creation to avoid 'as any'
    const { image_url, ...restOfData } = data;
    const payload = {
        ...restOfData,
        image_urls: image_url && image_url.trim() !== '' ? [image_url] : [],
    };

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      setSuccessMessage(`Product "${updatedProduct.name}" updated successfully!`);
      // Optionally, redirect or offer to view product
      // router.push('/admin/products'); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error updating product:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingProduct) {
    return <div className="container mx-auto p-4 text-center text-foreground bg-background">Loading product details...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-card shadow-md rounded-lg">
      <div className="mb-6">
        <Link href="/admin" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Admin Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-center text-card-foreground">Edit Product (ID: {productId})</h1>
      
      {error && <p className="text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 p-3 rounded-md mb-6 text-sm">Error: {error}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 p-3 rounded-md mb-6 text-sm">{successMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Product Name</label>
          <input id="name" {...register('name')} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">Description</label>
          <textarea id="description" {...register('description')} rows={4} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-muted-foreground">Price</label>
            <input id="price" type="number" step="0.01" {...register('price')} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-muted-foreground">Stock Quantity</label>
            <input id="stock_quantity" type="number" {...register('stock_quantity')} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
            {errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{errors.stock_quantity.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-muted-foreground">Category</label>
          <select 
            id="category" 
            {...register('category')} 
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
          >
            <option value="">Select a category</option>
            {productCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-muted-foreground">Primary Image URL (Optional)</label>
          <input id="image_url" {...register('image_url')} className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" placeholder="https://example.com/image.jpg"/>
          {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url.message}</p>}
        </div>

        <Button
          size="lg"
          type="submit"
          variant="secondary"
          disabled={isLoading || isFetchingProduct}
          className="w-full md:w-auto flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating Product...
            </>
          ) : 'Update Product'}
        </Button>
      </form>
    </div>
  );
} 