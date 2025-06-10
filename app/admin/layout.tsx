import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Assuming this is your NextAuth options path
import { SessionUser } from '@/lib/types';
import { redirect } from 'next/navigation';
// import Navbar from '@/components/layout/Navbar'; // Removed unused import
// import Footer from '@/components/layout/Footer'; // Removed unused import
// import Link from "next/link"; // Removed unused import

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // No session, or session.user is not defined
    console.log('AdminLayout: No session found, redirecting to /auth/login.');
    redirect('/auth/login'); // Or your main login page
    return null; // Or a loading/unauthorized component if redirect doesn't happen immediately
  }

  const user = session.user as SessionUser;
  if (user.role !== 'admin') {
    // User is not an admin
    console.log(`AdminLayout: User role "${user.role}" is not admin, redirecting to /.`);
    redirect('/'); // Redirect to homepage or an unauthorized page
    return null; // Or a loading/unauthorized component
  }

  // User is an admin, render the admin content
  return (
    <>
      {/* You might want a specific Admin Navbar here, or reuse the main one */}
      {/* <Navbar /> */}
      <main className="min-h-screen bg-background p-4">
        {/* Optional: Add a header or sidebar specific to admin layout */} 
        {/* <AdminSidebar /> */}
        <div className="container mx-auto">
            {children}
        </div>
      </main>
      {/* <Footer /> */}
    </>
  );
} 