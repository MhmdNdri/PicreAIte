import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle/db";
import { PromptTable } from "@/drizzle/schema";
import { isNull } from "drizzle-orm";
import { HeaderSection } from "./components/HeaderSection";
import { EmptyState } from "./components/EmptyState";
import { PromptGrid } from "./components/PromptGrid";

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
        <HeaderSection
          title="Transform Your Photos"
          subtitle="Select a style that speaks to you"
          description="Each style has its own magic - find the one that matches your vision"
        />

        {prompts.length === 0 ? (
          <EmptyState
            title="No Styles Available Yet"
            message="We're working on adding more styles. Check back soon for new creative options!"
          />
        ) : (
          <PromptGrid prompts={prompts} />
        )}
      </div>
    </main>
  );
}
