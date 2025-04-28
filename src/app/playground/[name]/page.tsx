import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { userId } = await auth();
  const resolvedParams = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const prompt = await db
    .select()
    .from(PromptTable)
    .where(
      and(
        eq(PromptTable.name, resolvedParams.name),
        isNull(PromptTable.deletedAt)
      )
    )
    .then((prompts: (typeof PromptTable.$inferSelect)[]) => prompts[0]);

  if (!prompt) {
    redirect("/playground");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1A1E33] dark:hover:text-[#E6F0FA] mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Styles
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="p-4 sm:p-8 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-3xl font-bold mb-2 text-[#1A1E33] dark:text-[#E6F0FA]">
                {prompt.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Style: {prompt.type}
              </p>
            </div>

            {prompt.imageUrl && (
              <div className="relative w-full aspect-square mb-6 sm:mb-8">
                <img
                  src={prompt.imageUrl}
                  alt={prompt.name}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none mb-6 sm:mb-8">
              <p className="text-sm sm:text-base text-muted-foreground">
                {prompt.promptDesc}
              </p>
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 p-4 sm:p-6 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#1A1E33] dark:text-[#E6F0FA]">
                Ready to Transform Your Photo?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Upload your photo and watch as it transforms into this unique
                style. The magic happens instantly!
              </p>
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                Upload Your Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
