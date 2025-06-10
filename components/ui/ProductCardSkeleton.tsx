import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="animate-pulse rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-col space-y-1.5">
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-20 bg-muted rounded"></div>
      </div>
      <div className="p-6 pt-0 flex items-center">
        <div className="h-10 bg-muted rounded w-1/4"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton; 