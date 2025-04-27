import {
  ArrowRight,
  Wand2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Star,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <div className="relative">
          <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-primary/20 to-primary/5 blur-xl" />
          <h1 className="relative animate-fade-up text-6xl font-bold sm:text-7xl md:text-8xl">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Picre
            </span>
            <span className="relative">
              <span className="absolute -inset-1 animate-pulse rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md" />
              <span className="relative bg-gradient-to-r from-blue-500/90 to-purple-500/90 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="bg-gradient-to-r from-primary/60 to-primary bg-clip-text text-transparent">
              te
            </span>
          </h1>
        </div>

        <p className="mt-6 max-w-2xl animate-fade-up text-xl text-muted-foreground sm:text-2xl">
          Transform your images with AI - no prompts needed. Just choose your
          style and let the magic happen.
        </p>

        <div className="mt-8 flex animate-fade-up gap-4">
          <Link
            href={userId ? "/playground" : "/sign-in"}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 dark:text-secondary shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Get Started
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-6 py-3 text-lg font-semibold transition-all duration-300 hover:bg-accent hover:text-accent-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            Learn More
          </button>
        </div>
      </section>
    </main>
  );
}
