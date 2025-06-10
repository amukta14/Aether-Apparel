'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Define the Zod schema for product validation
const productSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  stock_quantity: z.coerce.number().int().min(0, { message: 'Stock must be a non-negative integer' }),
  category: z.enum([
    "Pants", "Tops", "Shirts", "Accessories", "Bottoms", 
    "Dresses", "Outerwear", "Footwear", "Activewear"
  ], { message: "Invalid category" }),
  // material: z.string().optional(),
  // dimensions: z.string().optional(),
  // color_options: z.string().optional(), // Will be comma-separated string for now
  // Changed image_urls to be a single optional URL string for simpler form handling initially
  image_url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

const productCategories = [
  "Pants", "Tops", "Shirts", "Accessories", "Bottoms", 
  "Dresses", "Outerwear", "Footwear", "Activewear"
] as const;

export default function AddNewProductPage() {
  const [isLoading, setIsLoading] = useState(false);
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
    // delete (payload as any).image_url; // No longer needed

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const newProduct = await response.json();
      setSuccessMessage(`Product "${newProduct.name}" created successfully! ID: ${newProduct.id}`);
      reset(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error creating product:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="container mx-auto p-4 max-w-2xl bg-card shadow-md rounded-lg">
      <div class="mb-6">
        <Link href="/admin" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Admin Dashboard">
            <ArrowLeft class="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <h1 class="text-3xl font-bold mb-8 text-center text-card-foreground">Add New Product</h1>
      
      {error && <p class="text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 p-3 rounded-md mb-6 text-sm">Error: {error}</p>}
      {successMessage && <p class="text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 p-3 rounded-md mb-6 text-sm">{successMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} class="space-y-6">
        <div>
          <label htmlFor="name" class="block text-sm font-medium text-muted-foreground">Product Name</label>
          <input id="name" {...register('name')} class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
          {errors.name && <p class="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" class="block text-sm font-medium text-muted-foreground">Description</label>
          <textarea id="description" {...register('description')} rows={4} class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
          {errors.description && <p class="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" class="block text-sm font-medium text-muted-foreground">Price</label>
            <input id="price" type="number" step="0.01" {...register('price')} class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
            {errors.price && <p class="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label htmlFor="stock_quantity" class="block text-sm font-medium text-muted-foreground">Stock Quantity</label>
            <input id="stock_quantity" type="number" {...register('stock_quantity')} class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" />
            {errors.stock_quantity && <p class="text-red-500 text-xs mt-1">{errors.stock_quantity.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="category" class="block text-sm font-medium text-muted-foreground">Category</label>
          <select 
            id="category" 
            {...register('category')} 
            class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
          >
            <option value="">Select a category</option>
            {productCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p class="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="image_url" class="block text-sm font-medium text-muted-foreground">Primary Image URL (Optional)</label>
          <input id="image_url" {...register('image_url')} class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground" placeholder="https://example.com/image.jpg"/>
          {errors.image_url && <p class="text-red-500 text-xs mt-1">{errors.image_url.message}</p>}
        </div>

        <Button 
          size="lg" 
          variant="secondary"
          disabled={isLoading} 
          className="w-full md:w-auto flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Product...
            </>
          ) : 'Add Product'}
        </Button>
      </form>
    </div>
  );
} 