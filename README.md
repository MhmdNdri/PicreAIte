# Picreaite

A Next.js application with Drizzle ORM and PostgreSQL.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PNPM 8 or higher
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the database configuration in `.env`

4. Generate database migrations:

   ```bash
   pnpm db:generate
   ```

5. Push migrations to the database:

   ```bash
   pnpm db:push
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

## Database Structure

The database is structured as follows:

- `src/drizzle/schema.ts`: Database schema definitions
- `src/drizzle/schemaHelper.ts`: Helper functions and type definitions
- `src/drizzle/db.ts`: Database connection configuration
- `src/drizzle/migrations/`: Generated migration files

## Environment Variables

The application uses the following environment variables:

- `DATABASE_HOST`: PostgreSQL host
- `DATABASE_PORT`: PostgreSQL port
- `DATABASE_USER`: PostgreSQL user
- `DATABASE_PASSWORD`: PostgreSQL password
- `DATABASE_NAME`: PostgreSQL database name
- `DATABASE_SSL`: Whether to use SSL for database connection

## Available Scripts

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint
- `pnpm format`: Format code with Prettier
- `pnpm db:generate`: Generate database migrations
- `pnpm db:push`: Push migrations to the database
- `pnpm db:studio`: Open Drizzle Studio

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
