import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { isNull } from "drizzle-orm";
import { PromptCard } from "./components/PromptCard";

export default async function PlaygroundPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const prompts = await db
    .select()
    .from(PromptTable)
    .where(isNull(PromptTable.deletedAt));

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-[#1A1E33] dark:text-[#E6F0FA]">
            Transform Your Photos
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground mb-2">
            Select a style that speaks to you
          </p>
          <p className="text-xs sm:text-base text-muted-foreground">
            Each style has its own magic - find the one that matches your vision
          </p>
        </div>

        {prompts.length === 0 ? (
          <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none text-center">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-[#1A1E33] dark:text-[#E6F0FA]">
              No Styles Available Yet
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              We're working on adding more styles. Check back soon for new
              creative options!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                name={prompt.name}
                type={prompt.type}
                imageUrl={prompt.imageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
