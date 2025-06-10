# Aether Apparel

A modern e-commerce platform built with Next.js, featuring a responsive design and comprehensive shopping experience.

## Features

### User Features
- User authentication and authorization
  <img width="1658" alt="Screenshot 2025-06-10 at 10 26 52 PM" src="https://github.com/user-attachments/assets/1f8d6764-7e86-4ddc-a490-514bcc4bc46e" />

- Product browsing with advanced filtering and sorting
  <img width="1666" alt="Screenshot 2025-06-10 at 10 27 37 PM" src="https://github.com/user-attachments/assets/38501f2f-4732-42cf-98bd-c3ab2a66d310" />

- Shopping cart functionality
  <img width="1666" alt="Screenshot 2025-06-10 at 10 28 12 PM" src="https://github.com/user-attachments/assets/18e3fc55-fc19-44c6-81e4-6011fe77c6ba" />

- Wishlist management
  <img width="1648" alt="Screenshot 2025-06-10 at 10 31 03 PM" src="https://github.com/user-attachments/assets/0eca66bd-108b-4337-ad5e-67b8ed67c9c9" />

- Order tracking and history
  <img width="1678" alt="Screenshot 2025-06-10 at 10 32 10 PM" src="https://github.com/user-attachments/assets/f59128c0-aa95-41ae-8afb-cde87352b1d6" />

- Dark/Light theme support
- Responsive design for all devices

### Admin Features
- Secure admin dashboard
- Product management (CRUD operations)
- Order management
- User management
- Inventory tracking

### Shopping Experience
- Advanced product filtering by category and price
- Real-time price range filtering
- Product search functionality
- Voice search capability (placeholder)
- Responsive product grid
- Detailed product views

## Tech Stack

### Frontend
- Next.js 15.3.2
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Zustand (State Management)
- React Hook Form
- Zod (Form Validation)

### Backend
- Next.js API Routes
- Supabase (Database & Authentication)
- NextAuth.js
- bcryptjs (Password Hashing)

### Development Tools
- ESLint
- Prettier
- Turbopack
- TypeScript

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/your-username/aether-apparel.git
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The application is configured for deployment on Render. The `render.yaml` file contains the necessary configuration for deployment.

## License

This project is licensed under the MIT License.
