# Picreaite

A Next.js application with Drizzle ORM and PostgreSQL.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Bun 1.3 or higher
- PostgreSQL database
- Uploadthing account for image storage

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the database configuration in `.env`
   - Add your Uploadthing credentials (see Environment Variables section)

4. Generate database migrations:

   ```bash
   bun run db:generate
   ```

5. Push migrations to the database:

   ```bash
   bun run db:push
   ```

6. Start the development server:
   ```bash
   bun run dev
   ```

## Database Structure

The database is structured as follows:

- `src/drizzle/schema.ts`: Database schema definitions
- `src/drizzle/schemaHelper.ts`: Helper functions and type definitions
- `src/drizzle/db.ts`: Database connection configuration
- `src/drizzle/migrations/`: Generated migration files

## Environment Variables

The application uses the following environment variables:

### Database

- `DATABASE_HOST`: PostgreSQL host
- `DATABASE_PORT`: PostgreSQL port
- `DATABASE_USER`: PostgreSQL user
- `DATABASE_PASSWORD`: PostgreSQL password
- `DATABASE_NAME`: PostgreSQL database name
- `DATABASE_SSL`: Whether to use SSL for database connection

### Authentication (Clerk)

- `CLERK_WEBHOOK_SECRET`: Clerk webhook secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Clerk sign in URL
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Clerk sign up URL
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: Fallback URL after sign in
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: Fallback URL after sign up

### Image Storage (Uploadthing)

- `UPLOADTHING_SECRET`: Your uploadthing secret key
- `UPLOADTHING_TOKEN`: Your uploadthing token

## Available Scripts

- `bun run dev`: Start the development server
- `bun run build`: Build the application
- `bun run start`: Start the production server
- `bun run lint`: Run ESLint
- `bun run format`: Format code with Prettier
- `bun run db:generate`: Generate database migrations
- `bun run db:push`: Push migrations to the database
- `bun run db:studio`: Open Drizzle Studio

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
