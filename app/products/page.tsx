'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image'; // Import Next.js Image component
import Link from 'next/link'; // Import Link for View Details button
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FilterIcon } from 'lucide-react'; // Added FilterIcon

// Define a type for your product data
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock?: number | null; // Added optional stock field
  // Add other relevant product fields here
}

const productCategories = [
  "Pants", "Tops", "Shirts", "Accessories", "Bottoms", 
  "Dresses", "Outerwear", "Footwear", "Activewear"
] as const;

type Category = typeof productCategories[number];

const PRODUCTS_PER_PAGE = 9; // Example: 9 products per page

// Define a new component for the filter sidebar content
const FilterSidebarContent: React.FC<{
  selectedCategories: Category[];
  handleCategoryChange: (category: Category) => void;
  sortBy: string;
  handleSortChange: (value: string) => void;
  initialPriceRange: [number, number];
  activePriceRange: [number, number];
  handlePriceRangeChange: (value: number[]) => void;
  handlePriceRangeCommit: () => void;
  clearFilters: () => void;
  currentMinPriceDisplay: number;
  currentMaxPriceDisplay: number;
  isCategoryFilterOpen: boolean;
  setIsCategoryFilterOpen: (isOpen: boolean) => void;
}> = ({
  selectedCategories,
  handleCategoryChange,
  sortBy,
  handleSortChange,
  initialPriceRange,
  activePriceRange,
  handlePriceRangeChange,
  handlePriceRangeCommit,
  clearFilters,
  currentMinPriceDisplay,
  currentMaxPriceDisplay,
  isCategoryFilterOpen,
  setIsCategoryFilterOpen
}) => (
  <aside className="bg-card p-6 rounded-lg shadow-lg border border-border">
    <h2 className="text-xl font-semibold mb-6 text-card-foreground">Filters</h2>
    
    <Collapsible open={isCategoryFilterOpen} onOpenChange={setIsCategoryFilterOpen} className="mb-6">
      <CollapsibleTrigger className="w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-muted-foreground">Category</h3>
          {isCategoryFilterOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2 border-t border-border">
          {productCategories.map(category => (
            <div key={category} className="flex items-center">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryChange(category)}
                className="mr-2" // Removed custom color classes, default will use primary
              />
              <Label htmlFor={`category-${category}`} className="text-sm text-muted-foreground cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>

    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3 text-muted-foreground">Sort By</h3>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full"> {/* Removed custom color classes, default styling applies */}
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        <SelectContent> {/* Removed custom color classes, default styling applies */}
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3 text-muted-foreground">Price Range</h3>
      <Slider
        min={initialPriceRange[0]}
        max={initialPriceRange[1]}
        step={1}
        value={activePriceRange}
        onValueChange={handlePriceRangeChange}
        onValueCommit={handlePriceRangeCommit}
        // Removed complex custom color classes, default slider uses primary color
      />
      <div className="flex justify-between text-sm text-muted-foreground mt-2">
        <span>${currentMinPriceDisplay.toFixed(2)}</span>
        <span>${currentMaxPriceDisplay.toFixed(2)}</span>
      </div>
    </div>
    
    <Button 
      onClick={clearFilters} 
      variant="outline" 
      className="w-full transition-colors" // Removed custom color classes, outline variant uses primary
    >
      Clear All Filters
    </Button>
  </aside>
);

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState<string>('default'); // 'default', 'price-asc', 'price-desc'
  
  // Price range state
  // initialPriceRange will store the absolute min/max from all products
  const [initialPriceRange, setInitialPriceRange] = useState<[number, number]>([0, 1000]); 
  // activePriceRange is what the user selects with the slider
  const [activePriceRange, setActivePriceRange] = useState<[number, number]>([0, 1000]);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // New state for mobile filter toggle

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      const data: Product[] = await response.json();
      setAllProducts(data);

      if (data.length > 0) {
        const prices = data.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setInitialPriceRange([minPrice, maxPrice]);
        setActivePriceRange([minPrice, maxPrice]); // Set active range initially to full range
      } else {
        setInitialPriceRange([0, 0]); // Or some default if no products
        setActivePriceRange([0, 0]);
      }

    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Effect for filtering and sorting
  useEffect(() => {
    let tempProducts = [...allProducts];

    // 1. Filter by category
    if (selectedCategories.length > 0) {
      tempProducts = tempProducts.filter(product => 
        product.category && selectedCategories.includes(product.category as Category)
      );
    }

    // 2. Filter by price range
    tempProducts = tempProducts.filter(
      product => product.price >= activePriceRange[0] && product.price <= activePriceRange[1]
    );

    // 3. Sort products
    if (sortBy === 'price-asc') {
      tempProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      tempProducts.sort((a, b) => b.price - a.price);
    }
    // Default sorting can be by name or ID, or as they come from API
    // For now, 'default' means no explicit sort beyond what API provides or previous filters did

    // 4. Pagination
    setTotalPages(Math.ceil(tempProducts.length / PRODUCTS_PER_PAGE));
    const paginatedProducts = tempProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
    setDisplayedProducts(paginatedProducts);

    // Reset to page 1 if filters change and current page is out of bounds
    if (currentPage > Math.ceil(tempProducts.length / PRODUCTS_PER_PAGE) && tempProducts.length > 0) {
      setCurrentPage(1);
    } else if (tempProducts.length === 0) {
      setCurrentPage(1); // if no products, go to page 1
    }

  }, [allProducts, selectedCategories, activePriceRange, sortBy, currentPage]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to page 1
  };

  const handlePriceRangeChange = (value: number[]) => {
    setActivePriceRange(value as [number, number]);
    // Debounce or delay setCurrentPage(1) if performance is an issue during slider drag
    // For now, direct update:
    // setCurrentPage(1); // Commented out to avoid resetting page while dragging slider. User can click apply or it updates on mouse up.
  };
  
  // Call this when slider drag is finished
  const handlePriceRangeCommit = () => {
    setCurrentPage(1);
  }

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy('default');
    setActivePriceRange(initialPriceRange); // Reset to full range derived from all products
    setCurrentPage(1);
    setIsCategoryFilterOpen(true); // Re-open category filter on clear
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground mb-4 sm:mb-0">Our Products</h1>
          {/* Mobile filter toggle button */}
          <Button 
            variant="outline" 
            className="md:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 shadow-lg" // Standard outline button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <FilterIcon className="h-5 w-5" />
            Filters
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-1/4 lg:w-1/5">
            <FilterSidebarContent
              selectedCategories={selectedCategories}
              handleCategoryChange={handleCategoryChange}
              sortBy={sortBy}
              handleSortChange={handleSortChange}
              initialPriceRange={initialPriceRange}
              activePriceRange={activePriceRange}
              handlePriceRangeChange={handlePriceRangeChange}
              handlePriceRangeCommit={handlePriceRangeCommit}
              clearFilters={clearFilters}
              currentMinPriceDisplay={activePriceRange[0]} // Use active for display consistency
              currentMaxPriceDisplay={activePriceRange[1]} // Use active for display consistency
              isCategoryFilterOpen={isCategoryFilterOpen}
              setIsCategoryFilterOpen={setIsCategoryFilterOpen}
            />
          </div>

          {/* Mobile Filter Drawer/Modal */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsMobileFilterOpen(false)}>
              <div 
                className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-card shadow-xl p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-card-foreground">Filters</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileFilterOpen(false)}>
                    <ChevronDown className="h-5 w-5" /> {/* Or X icon */}
                  </Button>
                </div>
                <FilterSidebarContent
                  selectedCategories={selectedCategories}
                  handleCategoryChange={handleCategoryChange}
                  sortBy={sortBy}
                  handleSortChange={handleSortChange}
                  initialPriceRange={initialPriceRange}
                  activePriceRange={activePriceRange}
                  handlePriceRangeChange={handlePriceRangeChange}
                  handlePriceRangeCommit={handlePriceRangeCommit}
                  clearFilters={() => {
                    clearFilters();
                    setIsMobileFilterOpen(false); // Close after clearing
                  }}
                  currentMinPriceDisplay={activePriceRange[0]}
                  currentMaxPriceDisplay={activePriceRange[1]}
                  isCategoryFilterOpen={isCategoryFilterOpen} // You might want separate state for mobile
                  setIsCategoryFilterOpen={setIsCategoryFilterOpen} // Or manage it globally/pass down
                />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive text-lg">{error}</p>
                <Button onClick={fetchProducts} variant="outline" className="mt-4">Try Again</Button>
              </div>
            )}

            {isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            )}
            
            {!isLoading && !error && displayedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-xl">No products found matching your criteria.</p>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later!</p>
                <Button onClick={clearFilters} variant="secondary" className="mt-6">
                  Clear All Filters
                </Button>
              </div>
            )}

            {!isLoading && !error && displayedProducts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} passHref className="block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group">
                      <Card className="w-full h-full flex flex-col bg-card border-border transition-shadow duration-300 group-hover:shadow-xl">
                        <CardHeader className="p-0 relative">
                          <div className="aspect-square w-full overflow-hidden bg-muted">
                            <Image
                              src={product.image_url || '/placeholder-image.png'} 
                              alt={product.name}
                              width={400} 
                              height={400}
                              className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col flex-grow">
                          <CardTitle className="text-lg font-semibold mb-1 truncate text-card-foreground group-hover:text-primary transition-colors">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {product.description || 'No description available.'}
                          </CardDescription>
                          <p className="text-xl font-bold text-primary mt-auto">
                            ${product.price.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-12">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 