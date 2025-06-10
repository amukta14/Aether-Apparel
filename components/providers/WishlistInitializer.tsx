'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlistStore } from '@/store/wishlistStore';
import { SessionUser } from '@/lib/types'; // Import SessionUser for casting

export function WishlistInitializer() {
  const { data: session, status } = useSession();
  const { fetchWishlist, clearLocalWishlist } = useWishlistStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    const typedUser = session?.user as SessionUser | undefined;

    if (status === 'authenticated' && typedUser?.id && !fetchedRef.current) {
      // console.log('WishlistInitializer: User authenticated, fetching wishlist for user:', typedUser.id);
      fetchWishlist();
      fetchedRef.current = true;
    } else if (status === 'unauthenticated') {
      // console.log('WishlistInitializer: User unauthenticated, clearing local wishlist.');
      clearLocalWishlist();
      fetchedRef.current = false; 
    } else if (status === 'loading') {
      // console.log('WishlistInitializer: Session status loading...');
      fetchedRef.current = false;
    }
  }, [status, session, fetchWishlist, clearLocalWishlist]); // session is a dependency because typedUser depends on it

  return null; 
} 