import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { OrderStatus } from '@/lib/types'; // For validating status
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper to check if a string is a valid OrderStatus
const isValidOrderStatus = (status: string): status is OrderStatus => {
  const validStatuses: OrderStatus[] = [
    'pending', 'awaiting_payment', 'awaiting_fulfillment', 'awaiting_shipment',
    'awaiting_pickup', 'partially_shipped', 'shipped', 'completed',
    'cancelled', 'declined', 'refunded', 'partially_refunded', 'disputed'
  ];
  return validStatuses.includes(status as OrderStatus); // Cast to OrderStatus for includes check after string validation
};

// Define an interface for the route context parameters - This will be inlined
// interface AdminOrderRouteParams {
//   params: {
//     orderId: string;
//   };
// }

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } } // Inlined and destructured params
) {
  // TODO: Add admin role check
  // const session = await getServerSession(authOptions);
  // if (!session || session.user?.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { orderId } = params; // Access orderId directly from destructured params
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (!isValidOrderStatus(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single(); // To get the updated record back and check if it exists

    if (error) {
      console.error('Error updating order status:', error);
      if (error.code === 'PGRST116') { // Row not found
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Order not found after update attempt' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Update order status route error:', error);
    if (error instanceof SyntaxError) { // Potential JSON parsing error
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 