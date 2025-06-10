'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import ProductDetailSkeleton from '@/components/ui/ProductDetailSkeleton';
import { Heart, ShoppingCart, CheckCircle, XCircle } from 'lucide-react'; // Example icons
import { useCartStore } from '@/store/cartStore'; // Added import
import { useWishlistStore } from '@/store/wishlistStore'; // Added import
import toast from 'react-hot-toast'; // Added import

// Define a type for your product data, including an array for images
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string; alt?: string }[] | null; // Updated to match Supabase structure
  stock_quantity: number | null;
  // Add other relevant product fields here (e.g., category, material, color)
}

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default function ProductDetailPage({ params: paramsPromise }: ProductDetailPageProps) {
  const params = use(paramsPromise);
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItemToCart } = useCartStore(); // Added cart store hook
  const { addToWishlist, removeFromWishlist, isProductInWishlist } = useWishlistStore(); // Corrected destructuring from useWishlistStore

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch product');
      }
      const data: Product = await response.json();
      setProduct(data);
      if (data.images && data.images.length > 0 && data.images[0].url) {
        setSelectedImage(data.images[0].url);
      }
    } catch (err: unknown) {
      console.error(`Error fetching product ${productId}:`, err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    // Optionally, cap quantity at product.stock_quantity
    if (product && product.stock_quantity && value > product.stock_quantity) {
      value = product.stock_quantity;
    }
    setQuantity(value);
  };

  const incrementQuantity = () => {
    setQuantity(prev => {
        const newValue = prev + 1;
        if (product && product.stock_quantity && newValue > product.stock_quantity) {
            return product.stock_quantity;
        }
        return newValue;
    });
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = () => {
    if (product) {
      addItemToCart(product, quantity);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleToggleWishlist = async () => { // Made async to align with store actions
    if (product) {
      if (isProductInWishlist(product.id)) {
        try {
          await removeFromWishlist(product.id); // Pass only product.id
          // Toast is handled in the store, but you can add specific ones here if needed
          // toast.success(`${product.name} removed from wishlist!`);
        } catch (error) {
          console.error("Error removing from wishlist (product page):", error);
          toast.error("Failed to remove item from wishlist."); // Fallback toast
        }
      } else {
        try {
          await addToWishlist(product.id); // Pass only product.id
          // Toast is handled in the store
          // toast.success(`${product.name} added to wishlist!`);
        } catch (error) {
          console.error("Error adding to wishlist (product page):", error);
          toast.error("Failed to add item to wishlist."); // Fallback toast
        }
      }
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error loading product</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Button onClick={fetchProduct}>Try Again</Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Product not found.</h2>
      </div>
    );
  }

  const inStock = product.stock_quantity !== null && product.stock_quantity > 0;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image Gallery */}
        <div className="flex flex-col items-center">
          <div className="relative w-full h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4 shadow-lg">
            {(selectedImage && selectedImage.trim() !== '') ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="transition-opacity duration-300 ease-in-out hover:opacity-90 object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No image available
              </div>
            )}
          </div>
          {product.images && product.images.filter(imgObj => imgObj && imgObj.url && imgObj.url.trim() !== '').length > 0 && (
            <div className="grid grid-cols-4 gap-2 w-full max-w-md">
              {product.images.filter(imgObj => imgObj && imgObj.url && imgObj.url.trim() !== '').map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${selectedImage === img.url ? 'border-primary' : 'border-transparent'} hover:border-primary/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-black">{product.name}</h1>
          
          <p className="text-3xl font-semibold text-pastel-purple">
            ${product.price.toFixed(2)}
          </p>

          {product.stock_quantity !== null && (
            <div className={`flex items-center space-x-2 text-sm font-medium`}>
              {inStock ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              {inStock ? (
                <>
                  <span className="text-green-600">In Stock</span>
                  <span className="text-black"> ({product.stock_quantity} available)</span>
                </>
              ) : (
                <span className="text-black">Out of Stock</span>
              )}
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="text-xl font-semibold text-black mb-2">Description</h2>
              <p className="text-black leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {inStock && (
            <div className="flex items-center space-x-4 pt-2">
              <label htmlFor="quantity" className="font-medium text-black">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button variant="ghost" size="icon" onClick={decrementQuantity} className="rounded-r-none h-10 w-10 border-r text-black">
                  -
                </Button>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.stock_quantity || undefined}
                  className="w-16 h-10 text-center border-none focus:ring-0 bg-transparent text-black"
                  aria-label="Product quantity"
                />
                <Button variant="ghost" size="icon" onClick={incrementQuantity} className="rounded-l-none h-10 w-10 border-l text-black">
                  +
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto flex-grow items-center justify-center" 
              disabled={!inStock || !product}
              onClick={handleAddToCart} // Updated onClick
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto items-center justify-center" 
              onClick={handleToggleWishlist} // Updated onClick
              disabled={!product} 
            >
              <Heart className={`mr-2 h-5 w-5 ${product && isProductInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} /> 
              {product && isProductInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
} 