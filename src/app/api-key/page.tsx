import { ApiKeyManager } from "@/components/account/ApiKeyManager";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ApiKeyPage() {
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">API Key Settings</h1>
      <div className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-xl px-6 py-8 shadow-lg border border-gray-200/10 dark:border-gray-700/10">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Set your OpenAI API key to use your own account for image generation.
          Your key is securely encrypted and stored in our database.
        </p>
        <ApiKeyManager />
      </div>
    </div>
  );
}
