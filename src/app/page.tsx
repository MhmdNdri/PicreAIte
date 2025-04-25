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

export default function Home() {
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
          <button className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90">
            Get Started
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-6 py-3 text-lg font-semibold transition-all hover:bg-accent hover:text-accent-foreground">
            Learn More
          </button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid w-full max-w-4xl animate-fade-up grid-cols-2 gap-8 rounded-2xl border bg-card/50 p-8 backdrop-blur-sm md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">10K+</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Images Transformed
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">50+</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Visual Styles
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">98%</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Satisfaction Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="mt-2 text-sm text-muted-foreground">
              AI Processing
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
