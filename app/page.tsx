'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';
import { ArrowRight, ShoppingBag, Star, Heart } from 'lucide-react'; // Ensured Heart is imported

// Re-using the Product interface from products/page.tsx for consistency
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null; // Assuming a single primary image for the card
  category: string | null;
  stock?: number | null; // Added optional stock field
  // Add other relevant product fields if needed for cards
}

const FEATURED_PRODUCTS_COUNT = 3;

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetching all products and then slicing, 
      // ideally your API would support fetching a few random/specific featured products
      const response = await fetch('/api/products'); // Using the existing products API
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      const allProducts: Product[] = await response.json();
      
      if (allProducts.length <= FEATURED_PRODUCTS_COUNT) {
        setFeaturedProducts(allProducts);
      } else {
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffled.slice(0, FEATURED_PRODUCTS_COUNT));
      }
    } catch (err: unknown) {
      console.error('Error fetching featured products:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-background py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Discover Your <span className="text-primary">Style</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Elevate your wardrobe with our curated collection of unique apparel. Find pieces that reflect your personality and make a statement.
          </p>
          <Link href="/products">
            <Button size="lg" className="group">
              Shop All Apparel <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Featured Styles</h2>
            <p className="text-md text-muted-foreground mt-2">Handpicked items to define your look.</p>
          </div>

          {error && (
            <div className="text-center text-destructive-foreground bg-destructive/10 p-4 rounded-md mb-6">
              <p>Error loading featured products: {error}</p>
              <Button onClick={fetchFeaturedProducts} className="mt-2" variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: FEATURED_PRODUCTS_COUNT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!isLoading && !error && featuredProducts.length === 0 && (
            <div className="text-center text-gray-500">
              <p>No featured products available at the moment. Check back soon!</p>
            </div>
          )}

          {!isLoading && !error && featuredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="block group">
                  <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card border-border h-full">
                    <CardHeader className="p-0">
                      {product.image_url && (
                        <div className="aspect-video relative w-full bg-muted">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow p-6">
                      <CardTitle className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {product.description}
                        </CardDescription>
                      )}
                      <p className="text-lg font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="group">
                Explore All Products <ShoppingBag className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Value Props Section - Placeholder */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why Aether Apparel?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              <Star className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Unique Designs</h3>
              <p className="text-muted-foreground">Curated apparel you won&apos;t find anywhere else.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Premium Quality</h3>
              <p className="text-muted-foreground">Crafted for style, comfort, and durability.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Fashion Forward</h3>
              <p className="text-muted-foreground">Stay ahead of the trends with our latest collections.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
