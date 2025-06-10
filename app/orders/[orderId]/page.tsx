'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { ArrowLeft, Package, AlertTriangle, RefreshCw, MapPin, CreditCard, ListOrdered, Hash, CalendarDays, DollarSign } from 'lucide-react';
import { Order, OrderItem, ShippingAddress as ShippingAddressType } from '@/lib/types';

// Define a type for the parsed shipping address, which could be the structured type or a fallback string
type ParsedShippingAddress = ShippingAddressType | string | null;

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseShippingAddress = (shippingAddressString?: string | null): ParsedShippingAddress => {
    if (!shippingAddressString) return null;
    try {
      const parsed = JSON.parse(shippingAddressString);
      // Basic check if it resembles a ShippingAddressType object
      if (parsed && typeof parsed === 'object' && ('street' in parsed || 'recipient_name' in parsed)) {
        return parsed as ShippingAddressType;
      }
      return shippingAddressString; 
    } catch {
      return shippingAddressString; 
    }
  };

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        let errorMessage = 'Failed to fetch order details';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch { // Ignore if response is not JSON
        }
        throw new Error(errorMessage);
      }
      const data: Order = await response.json();
      setOrder(data);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center min-h-[60vh] flex flex-col justify-center items-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center min-h-[60vh] flex flex-col justify-center items-center bg-background">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <p className="text-destructive text-xl mb-3">Error loading order</p>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchOrderDetails} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
        <Link href="/orders" className="mt-4">
          <Button variant="link"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center min-h-[60vh] flex flex-col justify-center items-center bg-background">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-foreground">Order not found.</p>
        <Link href="/orders" className="mt-4">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders</Button>
        </Link>
      </div>
    );
  }
  
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    if (s === 'processing') return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    if (s === 'shipped') return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400';
    if (s === 'delivered' || s === 'completed') return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (s === 'cancelled') return 'bg-destructive/20 text-destructive';
    return 'bg-accent text-accent-foreground'; // Default to accent
  };

  const displayedShippingAddress = parseShippingAddress(order.shippingAddress);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-muted">
      <div className="mb-6">
        <Link href="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Orders
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="text-2xl text-card-foreground flex items-center">
                    <Hash className="mr-2 h-6 w-6 text-muted-foreground" /> Order #{order.id.substring(0, 8)}...
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground flex items-center mt-1">
                    <CalendarDays className="mr-1.5 h-4 w-4" /> Placed on: {new Date(order.createdAt).toLocaleString()}
                </CardDescription>
            </div>
            <span className={`mt-2 sm:mt-0 px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </CardHeader>

        <CardContent className="py-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Order Items Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center">
                <ListOrdered className="mr-2 h-5 w-5" /> Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/70 rounded-md">
                  <div>
                    <p className="font-medium text-card-foreground">{item.product?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} @ ${item.price?.toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    ${((item.quantity || 0) * (item.price || 0))?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shipping Details Section */}
          {order.shippingAddress && (
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Shipping Address
              </h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {typeof displayedShippingAddress === 'string' ? (
                  <p>{displayedShippingAddress}</p>
                ) : displayedShippingAddress && typeof displayedShippingAddress === 'object' ? (
                  <>
                    <p>{displayedShippingAddress.recipient_name || 'N/A'}</p>
                    <p>{displayedShippingAddress.street}</p>
                    {displayedShippingAddress.apartment_suite && <p>{displayedShippingAddress.apartment_suite}</p>}
                    <p>{displayedShippingAddress.city}, {displayedShippingAddress.postal_code}</p>
                    <p>{displayedShippingAddress.country}</p>
                    {displayedShippingAddress.phone_number && <p>Phone: {displayedShippingAddress.phone_number}</p>}
                  </>
                ) : <p>Shipping address not available or in an unexpected format.</p>}
              </div>
            </div>
          )}

          {/* Payment Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Payment Details
            </h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>Method: <span className="font-medium text-card-foreground">{order.paymentMethod?.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'N/A'}</span></p>
              {order.paymentId && (
                <p>Transaction ID: <span className="font-medium text-card-foreground">{order.paymentId}</span></p>
              )}
               <p>Status: <span className="font-medium text-card-foreground">Paid</span></p> {/* Assuming paid for now, or use order.status if it reflects payment status */}
            </div>
          </div>

        </CardContent>

        <CardFooter className="bg-muted/70 p-4 border-t border-border">
            <div className="flex justify-end items-center w-full">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subtotal: ${order.items?.reduce((acc: number, item: OrderItem) => acc + ((item.quantity || 0) * (item.price || 0)), 0).toFixed(2)}</p>
                    {/* Add Taxes, Shipping if stored separately for the order display */}
                    <p className="text-xl font-bold text-card-foreground mt-1 flex items-center justify-end">
                        <DollarSign className="mr-1.5 h-5 w-5"/> Total: ${order.totalAmount?.toFixed(2)}
                    </p>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
} 