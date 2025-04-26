import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md p-6 shadow-lg border border-gray-200/10 dark:border-gray-700/10">
          {children}
        </div>
      </div>
    </div>
  );
}
