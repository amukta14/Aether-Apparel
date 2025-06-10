'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { PackageSearch, AlertTriangle, RefreshCw } from 'lucide-react'; // Icon for orders

// Define a type for individual order items
interface OrderItem {
  id: string;
  product_id: string | null; // Product might be deleted
  quantity: number;
  price_at_purchase: number;
  product_name_snapshot: string | null;
}

// Define a type for your order data (mirroring the API response)
interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: { // Assuming structure based on checkout page
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  } | null;
  payment_method_dummy: string | null;
  payment_id_dummy: string | null;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred while fetching orders.';
      console.error("Error in fetchOrders:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center flex flex-col justify-center items-center min-h-[60vh] bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center flex flex-col justify-center items-center min-h-[60vh] bg-background">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <p className="text-destructive text-xl mb-3">Error loading orders</p>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 min-h-[calc(100vh-10rem)] bg-muted">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        {orders.length > 0 && (
           <Button onClick={fetchOrders} variant="outline" size="sm">
             <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
        )}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 flex flex-col justify-center items-center flex-grow bg-background min-h-[calc(100vh-20rem)]">
          <PackageSearch className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3 text-foreground">No Orders Yet</h2>
          <p className="mb-6 text-muted-foreground">It looks like you haven&apos;t placed any orders.</p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow bg-card">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-card-foreground">Order #{order.id.substring(0, 8)}...</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Placed on: {new Date(order.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <span 
                  className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap
                    ${order.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 
                      order.status.toLowerCase() === 'processing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                      order.status.toLowerCase() === 'shipped' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 
                      order.status.toLowerCase() === 'delivered' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 
                      order.status.toLowerCase() === 'cancelled' ? 'bg-destructive/20 text-destructive' : 
                      'bg-accent text-accent-foreground'}
                  `}
                >
                  {order.status}
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Items:</h4>
                  {order.order_items && order.order_items.length > 0 ? (
                    <ul className="list-disc list-inside pl-1 space-y-1 text-sm text-muted-foreground">
                      {order.order_items.slice(0, 3).map(item => (
                        <li key={item.id}>
                          {item.product_name_snapshot || 'Product name unavailable'} (x{item.quantity}) - ${item.price_at_purchase.toFixed(2)} each
                        </li>
                      ))}
                      {order.order_items.length > 3 && (
                        <li>...and {order.order_items.length - 3} more item(s)</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found for this order.</p>
                  )}
                </div>
                <p className="text-md font-semibold text-card-foreground">Total: ${order.total_amount.toFixed(2)}</p>
                 {order.shipping_address && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Shipped to: {order.shipping_address.fullName}, {order.shipping_address.address}, {order.shipping_address.city}
                    </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/50 p-4 flex justify-end">
                <Link href={`/orders/${order.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 