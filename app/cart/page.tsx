'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, ClientCartItem } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItemFromCart, updateItemQuantity, clearCart, getCartTotal } = useCartStore();
  const { status } = useSession();
  const router = useRouter();

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItemFromCart(productId);
    toast.success(`${productName} removed from cart.`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      // Optionally, confirm before removing or just prevent going below 1
      // For now, just ensure quantity doesn't go below 1 via store logic if preferred
      updateItemQuantity(productId, 1);
      return;
    }
    updateItemQuantity(productId, quantity);
    toast.success(`Quantity updated.`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared!');
  };

  const cartSubtotal = getCartTotal();
  const dummyTaxes = cartSubtotal * 0.05; // Example: 5% tax
  const dummyShipping = items.length > 0 ? 15.00 : 0; // Example: $15 shipping if cart not empty
  const grandTotal = cartSubtotal + dummyTaxes + dummyShipping;

  const isAuthenticated = status === 'authenticated';

  const handleCheckoutAction = () => {
    if (isAuthenticated) {
      router.push('/checkout');
    } else {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center bg-background min-h-[calc(100vh-var(--header-height,80px))]">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold text-foreground mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link href="/products">
          <Button size="lg">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-muted min-h-[calc(100vh-var(--header-height,80px))]">
      <h1 className="text-3xl font-bold text-foreground mb-8">Your Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item: ClientCartItem) => (
            <div key={item.id} className="flex flex-row items-center gap-4 bg-card p-3 sm:p-4 rounded-lg shadow-md border border-border">
              <Link href={`/products/${item.product.id}`} className="block flex-shrink-0">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-md overflow-hidden bg-muted">
                  <Image 
                    src={item.product.images && item.product.images.length > 0 ? item.product.images[0].url : '/placeholder-image.png'}
                    alt={item.product.name}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                </div>
              </Link>
              <div className="flex-grow flex flex-col justify-between self-stretch">
                <div>
                  <Link href={`/products/${item.product.id}`} className="hover:text-primary transition-colors">
                    <h2 className="text-base md:text-lg font-semibold text-card-foreground line-clamp-2">{item.product.name}</h2>
                  </Link>
                  <p className="text-sm md:text-base text-muted-foreground">Price: ${item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button variant="outline" size="icon" onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Minus className="h-4 w-4 sm:h-5 sm:h-5" />
                        </Button>
                        <span className="text-base md:text-lg font-medium w-6 sm:w-8 text-center text-card-foreground">{item.quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Plus className="h-4 w-4 sm:h-5 sm:h-5" />
                        </Button>
                    </div>
                    <p className="text-base md:text-lg font-semibold text-card-foreground whitespace-nowrap">
                        ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                </div>
              </div>
              <Button variant="destructive" size="icon" onClick={() => handleRemoveItem(item.product_id, item.product.name)} className="self-start sm:self-center ml-auto sm:ml-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:h-6" />
              </Button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1 bg-card p-6 rounded-lg shadow-md border border-border h-fit sticky top-24">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 border-b border-border pb-3">Order Summary</h2>
          <div className="space-y-3 text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (5%)</span>
              <span>${dummyTaxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${dummyShipping.toFixed(2)}</span>
            </div>
            <hr className="my-3 border-border"/>
            <div className="flex justify-between text-xl font-bold text-card-foreground">
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full mt-6"
            onClick={handleCheckoutAction}
          >
            {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
          </Button>
          {items.length > 0 && (
            <Button 
              size="lg" 
              variant="destructive"
              className="w-full mt-3"
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 