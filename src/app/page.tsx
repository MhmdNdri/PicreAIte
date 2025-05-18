import {
  ArrowRight,
  Wand2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Star,
  Palette,
  Layers,
  Heart,
  MessageCircle,
  Twitter,
  Github,
  Linkedin,
  Info,
  UploadCloud,
  Download,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { isNull, and, not } from "drizzle-orm";

export default async function Home() {
  const { userId } = await auth();

  // Fetch prompts directly from the database, like in playground
  const prompts = await db
    .select()
    .from(PromptTable)
    .where(
      and(isNull(PromptTable.deletedAt), not(isNull(PromptTable.imageUrl)))
    );

  // Shuffle and pick 8 random prompts with imageUrl
  const shuffled = prompts.sort(() => 0.5 - Math.random());
  const showcaseImages = shuffled
    .map((p) => p.imageUrl)
    .filter((url): url is string => typeof url === "string" && !!url)
    .slice(0, 8);

  return (
    <main className="min-h-screen scroll-smooth bg-gradient-to-b from-background to-muted text-foreground">
      {/* Hero Section */}
      <section
        className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:py-24"
        data-aos="fade-in"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="relative mb-8">
          <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-r from-primary/15 to-blue-500/15 blur-2xl" />
          <h1 className="relative animate-fade-up text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Picre
            </span>
            <span className="relative">
              <span className="absolute -inset-1.5 animate-pulse rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-lg" />
              <span className="relative bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="bg-gradient-to-r from-primary/70 to-primary bg-clip-text text-transparent">
              te
            </span>
          </h1>
        </div>

        <p className="mb-10 max-w-xl animate-fade-up text-lg text-muted-foreground animation-delay-200 sm:text-xl md:max-w-2xl">
          Transform your images with AI - no prompts needed. Just choose your
          style and let the magic happen.
        </p>

        <div className="flex animate-fade-up flex-col gap-4 animation-delay-400 sm:flex-row">
          <Link
            href={userId ? "/playground" : "/sign-in"}
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg ring-1 ring-primary/50 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:text-secondary"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#features"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-border bg-background px-8 py-3.5 text-base font-semibold shadow-md ring-1 ring-border/50 transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            Learn More
            <Info className="h-5 w-5 transition-transform group-hover:scale-110" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why PicreAIte?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover the powerful features that make image transformation
              effortless and fun.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Sparkles className="h-8 w-8 text-primary" />,
                title: "AI-Powered Transformations",
                description:
                  "Leverage cutting-edge AI to restyle your images with incredible accuracy and creativity.",
              },
              {
                icon: <Palette className="h-8 w-8 text-primary" />,
                title: "Diverse Style Library",
                description:
                  "Choose from a vast collection of artistic styles, from classic paintings to modern digital art.",
              },
              {
                icon: <Zap className="h-8 w-8 text-primary" />,
                title: "Instant Results",
                description:
                  "Experience near real-time image processing. No more waiting around for your masterpiece.",
              },
              {
                icon: <ImageIcon className="h-8 w-8 text-primary" />,
                title: "High-Quality Outputs",
                description:
                  "Download your transformed images in high resolution, perfect for sharing or printing.",
              },
              {
                icon: <Layers className="h-8 w-8 text-primary" />,
                title: "No Prompting Needed",
                description:
                  "Our intuitive interface lets you select styles visually, eliminating complex prompt engineering.",
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "User-Friendly Interface",
                description:
                  "Designed for everyone, from beginners to professionals. Transforming images is just a few clicks away.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="transform rounded-xl border border-border bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="bg-secondary/30 py-16 sm:py-24"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Transform Images in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Creating stunning AI-art has never been easier.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: 1,
                title: "Choose Your Style",
                description:
                  "Browse our extensive library of art styles and select the one that inspires you.",
                icon: <Palette className="h-10 w-10 text-primary" />,
              },
              {
                step: 2,
                title: "Upload Your Image",
                description:
                  "Start by uploading the image you want to transform. We support various formats.",
                icon: <UploadCloud className="h-10 w-10 text-primary" />,
              },
              {
                step: 3,
                title: "Download & Share",
                description:
                  "Our AI works its magic! Download your newly created art and share it with the world.",
                icon: <Download className="h-10 w-10 text-primary" />,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative transform rounded-xl border border-border bg-card p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                  Step {item.step}
                </div>
                <div className="mb-6 mt-8 flex justify-center">{item.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section
        className="py-16 sm:py-24"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              See the Magic
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore a gallery of images transformed by PicreAIte.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {showcaseImages.length > 0 ? (
              showcaseImages.map((src, index) => (
                <div
                  key={src || index}
                  className="group relative aspect-square transform overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <img
                    src={src}
                    alt={`Showcase image ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    width={400}
                    height={400}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              ))
            ) : (
              <p className="col-span-full mt-8 text-center text-muted-foreground">
                No images to display yet. Check back soon!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        className="py-16 sm:py-24"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        <div className="container mx-auto flex flex-col items-center justify-center px-4 text-center">
          <Wand2 className="mb-4 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Create Magic?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of users transforming their images with the power of
            AI. Start your creative journey today!
          </p>
          <div className="mt-8">
            <Link
              href={userId ? "/playground" : "/sign-in"}
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg ring-1 ring-primary/50 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:text-secondary"
            >
              Get Started For Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-border bg-background py-8 text-center"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PicreAIte. All pixels aligned.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Crafted with <Sparkles className="inline h-3 w-3 text-yellow-400" />{" "}
            by AI, fine-tuned by humans.
          </p>
        </div>
      </footer>
    </main>
  );
}
