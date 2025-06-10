# Aether Apparel

A modern e-commerce platform built with Next.js, featuring a responsive design and comprehensive shopping experience.

## Features

### User Features
- User authentication and authorization
- Product browsing with advanced filtering and sorting
- Shopping cart functionality
- Wishlist management
- Order tracking and history
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
