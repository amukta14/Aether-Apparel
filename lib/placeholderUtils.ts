import { ProductImage } from '@/lib/types'; // Corrected import path

const placeholderColorSchemes = [
  "https://placehold.co/600x400/A0D2DB/FFFFFF", // Light Blue BG, White Text
  "https://placehold.co/600x400/C3AED6/333333", // Light Purple BG, Dark Grey Text
  "https://placehold.co/600x400/EBF8FF/333333", // Very Light Blue BG, Dark Grey Text
  "https://placehold.co/600x400/678b91/FFFFFF", // Theme Teal BG, White Text
  "https://placehold.co/600x400/a0d2d9/333333", // Theme Lighter Teal BG, Dark Grey Text
];

export function generatePlaceholderImage(productName?: string | null): ProductImage {
  const placeholderText = productName ? encodeURIComponent(productName) : "Product Image";
  const randomSchemeBase = placeholderColorSchemes[Math.floor(Math.random() * placeholderColorSchemes.length)];
  const dynamicPlaceholderUrl = `${randomSchemeBase}.png?text=${placeholderText}`;
  
  return {
    url: dynamicPlaceholderUrl,
    alt: productName || "Placeholder Image",
  };
} 