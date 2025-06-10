import { NextResponse, type NextRequest } from 'next/server';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import bcrypt from 'bcryptjs'; // Added bcryptjs import

// Define a basic type for the user record, including the password
interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string; // This is the sensitive field we insert and want to omit from response
  emailVerified?: Date | string | null; // Supabase might return string for timestamptz
  image?: string | null;
  // Add any other fields you expect in your users table
}

const registrationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // 1. Check if user exists using the public Supabase client.
    // RLS policies must allow this select operation for an anon user if they are restrictive.
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // PGRST116: 'Filtered request failed: Object Not Found' which means no user found, not an actual error for our check.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { message: 'Error checking user existence', error: fetchError.message },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. Password Hashing Placeholder
    // WARNING: NEVER STORE PLAIN TEXT PASSWORDS IN A REAL APPLICATION.
    // You must hash the password securely before saving it.
    // Example using a library like bcrypt (install it first: npm install bcryptjs @types/bcryptjs):
    // import bcrypt from 'bcryptjs';
    // const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(`TODO: Implement password hashing for: ${password}`);
    // const hashedPassword = password; // Store plain text password TEMPORARILY for this placeholder.
    const hashedPassword = await bcrypt.hash(password, 10); // Implemented password hashing

    // 3. Insert new user into the public 'users' table.
    // RLS policies must allow this insert operation for an anon user.
    // The 'users' table MUST have a 'password' (or similar) column for this to work.
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }]) // Using field named 'password'
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return NextResponse.json(
        { message: 'Error creating user', error: insertError.message },
        { status: 500 }
      );
    }

    // It's good practice to not return the password, even if it's hashed, in API responses.
    if (newUser) {
      // Cast newUser to our defined type to help with password omission
      const userRecord = newUser as UserRecord;
      // Destructure to omit password, prefixing with _ to indicate it might be unused intentionally by some linters
      // const { password: _unusedPassword, ...userWithoutPassword } = userRecord; 
      // Create a new object without the password property
      const userWithoutPassword = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        image: userRecord.image,
        // Add other non-sensitive fields here if they exist on UserRecord
      };
      return NextResponse.json(
        { message: 'User registered successfully', user: userWithoutPassword },
        { status: 201 }
      );
    }
    
    // Fallback, though select().single() with no error should provide data or an error.
    return NextResponse.json({ message: 'User registration attempted, but no user data returned' }, { status: 500 });

  } catch (error) {
    console.error('Registration API error:', error);
    let message = 'Internal server error during registration.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
} 