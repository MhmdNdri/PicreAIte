import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function PlaygroundPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Playground</h1>
        <div className="grid gap-6">
          {/* Add your playground content here */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome to PicreAIte Playground
            </h2>
            <p className="text-muted-foreground">
              Start creating amazing AI-powered images here. More features
              coming soon!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
