'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ShoppingBag, RefreshCw } from 'lucide-react';

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isLoading, setIsLoading] = useState(false);

  // Dummy shipping details state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const subtotal = getCartTotal();
  // These can be made more dynamic later
  const shippingCost = items.length > 0 ? 5.00 : 0; 
  const taxes = subtotal * 0.08; // 8% tax example
  const totalAmount = subtotal + shippingCost + taxes;

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    // Basic validation for shipping details
    if (!shippingDetails.fullName || !shippingDetails.address || !shippingDetails.city || !shippingDetails.postalCode || !shippingDetails.country) {
        toast.error('Please fill in all shipping details.');
        setIsLoading(false);
        return;
    }

    let paymentIdDummyValue: string | undefined = undefined;

    if (paymentMethod === 'credit_card') {
        const ccNumberInput = document.getElementById('cc-number') as HTMLInputElement;
        const ccExpiryInput = document.getElementById('cc-expiry') as HTMLInputElement;
        const ccCvcInput = document.getElementById('cc-cvc') as HTMLInputElement;

        // Basic validation for dummy card details
        if (!ccNumberInput?.value || ccNumberInput.value.length < 15 || !ccExpiryInput?.value || !ccCvcInput?.value) {
            toast.error('Please fill in all credit card details.');
            setIsLoading(false);
            return;
        }
        // In a real app, this would come from a payment processor after tokenization/authorization
        paymentIdDummyValue = `dummy_tx_${Date.now()}`;
    }
    
    const orderPayload = {
      items,
      totalAmount,
      shippingDetails,
      paymentMethod,
      paymentIdDummy: paymentIdDummyValue,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to place order');
      }

      toast.success(result.message || 'Order placed successfully!');
      clearCart(); 
      router.push('/orders'); // Redirect to the orders page

    } catch (error: unknown) {
      console.error('Error placing order:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Order placement failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">You can&apos;t proceed to checkout with an empty cart.</p>
        <Link href="/products">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 dark:bg-background">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center dark:text-white">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Shipping & Payment Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={shippingDetails.fullName} onChange={handleInputChange} placeholder="John Doe" required />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={shippingDetails.address} onChange={handleInputChange} placeholder="123 Main St" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={shippingDetails.city} onChange={handleInputChange} placeholder="Anytown" required />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" value={shippingDetails.postalCode} onChange={handleInputChange} placeholder="12345" required />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" value={shippingDetails.country} onChange={handleInputChange} placeholder="United States" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="credit_card" value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 transition-colors dark:border-border dark:hover:bg-accent">
                  <RadioGroupItem value="credit_card" id="credit_card" className="dark:border-border data-[state=checked]:dark:bg-primary data-[state=checked]:dark:text-primary-foreground" />
                  <Label htmlFor="credit_card" className="flex-grow cursor-pointer dark:text-card-foreground">Credit / Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 transition-colors dark:border-border dark:hover:bg-accent">
                  <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" className="dark:border-border data-[state=checked]:dark:bg-primary data-[state=checked]:dark:text-primary-foreground" />
                  <Label htmlFor="cash_on_delivery" className="flex-grow cursor-pointer dark:text-card-foreground">Cash on Delivery</Label>
                </div>
              </RadioGroup>
              
              {paymentMethod === 'credit_card' && (
                <div className="mt-6 space-y-4 p-4 border-t dark:border-border">
                  <h3 className="font-medium mb-2 dark:text-card-foreground">Enter Card Details:</h3>
                  <div>
                    <Label htmlFor="cc-number" className="dark:text-muted-foreground">Card Number</Label>
                    <Input id="cc-number" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cc-expiry" className="dark:text-muted-foreground">Expiry Date</Label>
                      <Input id="cc-expiry" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="cc-cvc" className="dark:text-muted-foreground">CVC</Label>
                      <Input id="cc-cvc" placeholder="•••" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl dark:text-card-foreground">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="truncate max-w-[150px] sm:max-w-[200px] dark:text-muted-foreground">{item.product.name} (x{item.quantity})</span>
                  <span className="font-medium dark:text-card-foreground">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-3 bg-border" />
              <div className="flex justify-between font-medium">
                <span className="dark:text-muted-foreground">Subtotal</span>
                <span className="dark:text-card-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-muted-foreground">Shipping</span>
                <span className="dark:text-card-foreground">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-muted-foreground">Taxes (8%)</span>
                <span className="dark:text-card-foreground">${taxes.toFixed(2)}</span>
              </div>
              <Separator className="my-3 bg-border" />
              <div className="flex justify-between text-xl font-semibold">
                <span className="dark:text-card-foreground">Total Amount</span>
                <span className="dark:text-card-foreground">${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handlePlaceOrder} 
                disabled={isLoading || items.length === 0}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 