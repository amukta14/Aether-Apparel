"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Mic, ShoppingCart, Heart, Package, HomeIcon, UserCircle, Menu, X, Aperture } from 'lucide-react'; // Added Aperture
import { useCartStore } from '@/store/cartStore'; // Added import
import { usePathname } from 'next/navigation'; // Added usePathname
import { Button } from "@/components/ui/Button"; // Assuming Button is a ShadCN component or compatible
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import ShadCN Dropdown components
import { useState } from 'react'; // Added useState
import { toast } from 'react-hot-toast'; // Added toast
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton"; // Added import

const Navbar = () => {
  const { data: session } = useSession();
  const cartItemCount = useCartStore(state => state.getItemCount()); // Assuming getItemCount is the selector for count
  const activateGuestCart = useCartStore(state => state.activateGuestCart); // Added
  const pathname = usePathname(); // Get current pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State for mobile menu
  // const wishlistItemCount = useWishlistStore(state => state.wishlistItems.length); // Removed wishlistItemCount

  // Define active link class - using pastel-purple as it's used for the logo
  const activeLinkClass = "text-primary font-semibold dark:text-foreground";
  const inactiveLinkClass = "text-foreground/80 hover:text-secondary transition-colors duration-300 dark:text-foreground dark:hover:text-secondary";
  const mobileLinkClass = "block py-2 px-4 text-sm hover:bg-accent dark:hover:bg-accent"; // Class for mobile links

  const getLinkClass = (path: string) => {
    return pathname === path ? activeLinkClass : inactiveLinkClass;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-background p-4 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center text-2xl font-bold text-primary dark:text-foreground">
          <Aperture className="h-7 w-7 mr-2" /> {/* Added Aperture icon */}
          Aether Apparel
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/" className={`${getLinkClass("/")} flex items-center`}>
            <HomeIcon className="h-5 w-5 mr-1" />
            Home
          </Link>
          <Link href="/products" className={`${getLinkClass("/products")} flex items-center`}>
            <Package className="h-5 w-5 mr-1" /> {/* Using Package icon for products */}
            Products
          </Link>
          <Link href="/cart" className={`${getLinkClass("/cart")} flex items-center`}>
            <ShoppingCart className="h-5 w-5 mr-1" />
            Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Link>
          <Link href="/wishlist" className={`${getLinkClass("/wishlist")} relative flex items-center`}>
            <Heart className="h-5 w-5 mr-1" />
            Wishlist
          </Link>
          {session && ( // Conditionally render Orders link
            <Link href="/orders" className={`${getLinkClass("/orders")} relative flex items-center`}>
              <Package className="h-5 w-5 mr-1" />
              Orders
            </Link>
          )}
          <button 
            title="Voice Search (Placeholder)" 
            className="text-muted-foreground hover:text-secondary transition-colors duration-300 p-1 dark:hover:text-secondary"
            onClick={() => alert('Voice search functionality coming soon!')} // Placeholder action
          >
            <Mic className="h-5 w-5" />
            <span className="sr-only">Voice Search</span>
          </button>

          <ThemeToggleButton /> {/* Added ThemeToggleButton for desktop */}

          {/* Profile Dropdown (Desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <UserCircle className="h-7 w-7 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
              {session ? (
                <>
                  <DropdownMenuLabel className="font-normal text-popover-foreground">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || "User"}
                      </p>
                      {session.user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-border" />
                  {/* "My Account" link removed */}
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut({ redirect: false });
                      activateGuestCart();
                      toast.error("Logged out successfully.");
                    }} 
                    className="cursor-pointer hover:bg-accent text-popover-foreground"
                  >
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-popover-foreground">
                    <Link href="/auth/login">Log in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-popover-foreground">
                    <Link href="/auth/signup">Sign up</Link>
                  </DropdownMenuItem>
                  {cartItemCount > 0 && ( // If not logged in and cart has items
                    <>
                      <DropdownMenuSeparator className="border-border" />
                      <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                        You have items in your cart.
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-popover-foreground">
                        {/* This could eventually trigger a "login and save cart" flow */}
                        <Link href="/auth/login">Login to save cart</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button and Voice Search */}
        <div className="md:hidden flex items-center space-x-2"> {/* Added space-x-2 for spacing */}
          <button
            title="Voice Search (Placeholder)"
            className="text-muted-foreground hover:text-secondary transition-colors duration-300 p-1 dark:hover:text-secondary"
            onClick={() => alert('Voice search functionality coming soon!')}
          >
            <Mic className="h-6 w-6" /> {/* Adjusted size for consistency */}
            <span className="sr-only">Voice Search</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground hover:text-secondary focus:outline-none focus:text-secondary p-1"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-border shadow-lg py-2">
          <Link href="/" className={`${getLinkClass("/")} ${mobileLinkClass} flex items-center px-4`} onClick={closeMobileMenu}>
            <HomeIcon className="h-5 w-5 mr-2" /> Home
          </Link>
          <Link href="/products" className={`${getLinkClass("/products")} ${mobileLinkClass} flex items-center px-4`} onClick={closeMobileMenu}>
            <Package className="h-5 w-5 mr-2" /> Products
          </Link>
          <Link href="/cart" className={`${getLinkClass("/cart")} ${mobileLinkClass} flex items-center px-4`} onClick={closeMobileMenu}>
            <ShoppingCart className="h-5 w-5 mr-2" /> Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Link>
          <Link href="/wishlist" className={`${getLinkClass("/wishlist")} ${mobileLinkClass} flex items-center px-4`} onClick={closeMobileMenu}>
            <Heart className="h-5 w-5 mr-2" /> Wishlist
          </Link>
          {session && (
            <Link href="/orders" className={`${getLinkClass("/orders")} ${mobileLinkClass} flex items-center px-4`} onClick={closeMobileMenu}>
              <Package className="h-5 w-5 mr-2" /> Orders
            </Link>
          )}
          
          <div className="px-4 py-2"> {/* Added wrapper for mobile theme toggle */}
            <ThemeToggleButton isMobile={true} />
          </div>

          <div className="border-t border-border my-2"></div>

          {session ? (
            <>
              <div className="px-4 py-2">
                <p className="text-sm font-medium leading-none text-foreground">
                  {session.user?.name || "User"}
                </p>
                {session.user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                )}
              </div>
              {/* "My Account" link removed from mobile menu */}
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  activateGuestCart();
                  closeMobileMenu();
                  toast.error("Logged out successfully.");
                }}
                className={`${mobileLinkClass} w-full text-left flex items-center px-4 text-foreground`}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={`${mobileLinkClass} flex items-center px-4 text-foreground`} onClick={closeMobileMenu}>
                Log in
              </Link>
              <Link href="/auth/signup" className={`${mobileLinkClass} flex items-center px-4 text-foreground`} onClick={closeMobileMenu}>
                Sign up
              </Link>
              {cartItemCount > 0 && (
                <>
                  <div className="border-t border-border my-2"></div>
                  <p className="text-xs text-muted-foreground px-4 py-1.5">
                    You have items in your cart.
                  </p>
                  <Link href="/auth/login" className={`${mobileLinkClass} flex items-center px-4 text-foreground`} onClick={closeMobileMenu}>
                    Login to save cart
                  </Link>
                </>
              )}
            </>
          )}
           {/* Voice search removed from here as it's now outside the mobile menu */}
        </div>
      )}
    </nav>
  );
};

export default Navbar;