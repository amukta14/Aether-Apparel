import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from 'react-hot-toast';
import CartInitializer from "@/components/providers/CartInitializer";
import { WishlistInitializer } from "@/components/providers/WishlistInitializer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuraDecor - Elegance in Every Detail",
  description: "Discover unique and elegant home decor items at AuraDecor. Style your space with our curated collection.",
  // Add more metadata as needed: icons, openGraph, etc.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProviderWrapper>
            <CartInitializer />
            <WishlistInitializer />
            <Toaster position="bottom-center" />
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
