'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';

const CartInitializer = () => {
  const { status } = useSession();
  const initializeCart = useCartStore((state) => state.initializeCart);
  const activateGuestCart = useCartStore((state) => state.activateGuestCart);

  useEffect(() => {
    if (status === 'authenticated') {
      initializeCart(true);
    } else if (status === 'unauthenticated') {
      activateGuestCart();
    }
  }, [status, initializeCart, activateGuestCart]);

  return null; // This component doesn't render anything visible
};

export default CartInitializer; 