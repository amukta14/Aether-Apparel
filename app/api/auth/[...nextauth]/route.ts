import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabaseClient"; // Assuming your client is here
import { SessionUser } from "@/lib/types"; // Import the SessionUser type
import bcrypt from 'bcryptjs'; // Added bcryptjs import

// Make sure your User type in /lib/types.ts includes id, email, name, and role
// For example:
// export interface User {
//   id: string;
//   name?: string | null;
//   email: string;
//   role?: string | null;
// }

// Define a type for the user object returned by the authorize function
// This should align with what the adapter and JWT/session callbacks expect.
interface AuthorizeUser extends NextAuthUser {
  id: string;
  name?: string | null;
  email?: string | null; 
  role?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Important: Use SERVICE_ROLE_KEY for adapter
    // Ensure these table names match your Supabase schema if you customized them.
    // The adapter by default expects: users, accounts, sessions, verification_tokens
    // If your public user data is in a 'profiles' table linked to 'auth.users',
    // you might need custom handling in callbacks to merge profile data.
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthorizeUser | null> {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing');
          return null;
        }

        // Fetch user from your public 'users' or 'profiles' table
        const { data: user, error } = await supabase
          .from('users') // Or 'profiles' if that's your table name
          .select('*') // Select all fields to get the password hash
          .eq('email', credentials.email)
          .single();

        if (error) {
          console.error('Error fetching user for credentials:', error);
          return null;
        }

        if (user && user.password) { // Check if user exists and has a password field
          // IMPORTANT: Mock password check for now.
          // In a real application, you MUST hash and compare passwords securely.
          // For example, if Supabase Auth handles password, you'd sign in with Supabase Auth first,
          // then link or retrieve the profile for NextAuth.
          // If you manage passwords yourself in the 'users' table (not recommended with Supabase Auth),
          // you'd compare `credentials.password` with `user.password_hash` using bcrypt.
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (isValidPassword) {
            // Return the user object that NextAuth expects.
            // Ensure it includes id, email, name (optional), image (optional).
            // The Supabase adapter will handle mapping this to its own schema.
            return {
              id: user.id, // Ensure your 'users' table has an 'id' (UUID)
              email: user.email,
              name: user.name,
              // Add any other fields you want in the JWT/session, like 'role'
              // These can be populated in the jwt and session callbacks.
              role: user.role, 
            } as AuthorizeUser; // Cast to AuthorizeUser
          } else {
            console.error('Invalid password for user:', credentials.email);
            return null;
          }
        } else {
          console.error('No user found with email:', credentials.email);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Using JWT for session strategy
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as AuthorizeUser; // Cast user to AuthorizeUser
        if (u.role) { 
          token.role = u.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as SessionUser).id = token.id as string;
      }
      if (token.role && session.user) {
        (session.user as SessionUser).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Optional: Custom sign-in page
    // error: '/auth/error', // Optional: Custom error page
  },
  // Debugging can be helpful during development
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 