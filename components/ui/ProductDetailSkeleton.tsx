import React from 'react';

const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image Gallery Skeleton */}
        <div>
          <div className="h-[400px] md:h-[500px] bg-muted rounded-lg mb-4"></div>
          <div className="grid grid-cols-4 gap-2">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded w-3/4"></div> {/* Product Name */}
          <div className="h-6 bg-muted rounded w-1/4"></div> {/* Price */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full"></div> {/* Description line 1 */}
            <div className="h-4 bg-muted rounded w-full"></div> {/* Description line 2 */}
            <div className="h-4 bg-muted rounded w-5/6"></div> {/* Description line 3 */}
          </div>
          <div className="h-6 bg-muted rounded w-1/3"></div> {/* Stock Availability */}
          <div className="h-12 bg-muted rounded w-1/2"></div> {/* Quantity Selector & Add to Cart */}
          <div className="h-10 bg-muted rounded w-1/3"></div> {/* Add to Wishlist */}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton; 