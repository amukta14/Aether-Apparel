'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge'; // For status display
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Shadcn Select
import { ArrowUpDown, RefreshCw, AlertTriangle, Package, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'ascending' | 'descending' } | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update order status');
      }
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message); 
      } else {
        setError('Failed to update status.');
      }
    }
  };

  const orderStatuses: OrderStatus[] = [
    'pending', 'awaiting_payment', 'awaiting_fulfillment', 'awaiting_shipment',
    'awaiting_pickup', 'partially_shipped', 'shipped', 'completed',
    'cancelled', 'declined', 'refunded', 'partially_refunded', 'disputed'
  ];

  const getStatusColorClass = (status: OrderStatus | string) => {
    const s = status.toLowerCase();
    if (s === 'pending') return 'bg-yellow-500 hover:bg-yellow-600';
    if (s === 'awaiting_payment') return 'bg-yellow-400 hover:bg-yellow-500 text-black';
    if (s === 'awaiting_fulfillment' || s === 'processing') return 'bg-blue-500 hover:bg-blue-600';
    if (s === 'awaiting_shipment') return 'bg-sky-500 hover:bg-sky-600';
    if (s === 'shipped' || s === 'dispatched') return 'bg-indigo-500 hover:bg-indigo-600';
    if (s === 'completed' || s === 'delivered') return 'bg-green-500 hover:bg-green-600';
    if (s === 'cancelled') return 'bg-red-500 hover:bg-red-600';
    if (s === 'declined') return 'bg-red-700 hover:bg-red-800';
    if (s === 'refunded' || s === 'partially_refunded') return 'bg-gray-500 hover:bg-gray-600';
    if (s === 'disputed') return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  const requestSort = (key: keyof Order) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = React.useMemo(() => {
    const sortableOrders = [...orders];
    if (sortConfig !== null) {
      sortableOrders.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  if (isLoading) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] flex flex-col justify-center items-center bg-background text-foreground">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading orders...</p>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] flex flex-col justify-center items-center bg-background text-foreground">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="mt-3 text-xl text-destructive-foreground">Error loading orders</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchOrders} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6 bg-background text-foreground">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link href="/admin" passHref>
            <Button variant="outline" size="icon" aria-label="Back to Admin">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Manage Orders ({orders.length})</h1>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive-foreground px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
          </div>
      )}

      {sortedOrders.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-lg text-muted-foreground">No orders found.</p>
        </div>
      )}

      {sortedOrders.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead onClick={() => requestSort('id')} className="cursor-pointer hover:bg-muted/50 text-foreground">
                Order ID <ArrowUpDown className="ml-2 h-3 w-3 inline" />
              </TableHead>
              <TableHead onClick={() => requestSort('createdAt')} className="cursor-pointer hover:bg-muted/50 text-foreground">
                Date <ArrowUpDown className="ml-2 h-3 w-3 inline" />
              </TableHead>
              <TableHead onClick={() => requestSort('totalAmount')} className="cursor-pointer hover:bg-muted/50 text-foreground">
                Total <ArrowUpDown className="ml-2 h-3 w-3 inline" />
              </TableHead>
              <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/50 text-foreground">
                Status <ArrowUpDown className="ml-2 h-3 w-3 inline" />
              </TableHead>
              <TableHead className="text-foreground">Change Status</TableHead>
              <TableHead className="text-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order) => (
              <TableRow key={order.id} className="border-border">
                <TableCell className="font-medium text-foreground">#{order.id.substring(0,8)}...</TableCell>
                <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-foreground">${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColorClass(order.status)} text-white`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    value={order.status}
                    onValueChange={(newStatus: string) => handleStatusChange(order.id, newStatus as OrderStatus)}
                  >
                    <SelectTrigger className="w-[180px] bg-background border-input text-foreground focus:ring-ring">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {orderStatuses.map(stat => (
                        <SelectItem key={stat} value={stat} className="hover:bg-accent focus:bg-accent">
                          {stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                    <Link href={`/orders/${order.id}`} passHref>
                        <Button variant="outline" size="sm">
                           <Edit className="mr-2 h-4 w-4"/> View
                        </Button>
                    </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminOrdersPage; 