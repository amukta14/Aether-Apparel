"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button"; // Corrected import path
import { Product } from "@/lib/types";
import { X } from "lucide-react";

interface WishlistItemCardProps {
  product: Product;
  onRemove: (productId: string) => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ product, onRemove }) => {
  // Assuming product.images is an array of objects with a url property
  const imageUrl = product.images && product.images.length > 0 && product.images[0]?.url
    ? product.images[0].url
    : "/placeholder-image.png"; // Fallback placeholder

  return (
    <div className="border border-border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 truncate text-card-foreground">
          <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="text-primary font-bold text-xl mb-3">
          ${product.price.toFixed(2)}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onRemove(product.id)}
          >
            <X className="mr-2 h-4 w-4" /> Remove
          </Button>
          {/* Optionally, add an "Add to Cart" button here */}
          {/* <Button variant="secondary" size="sm">Add to Cart</Button> */}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard; 