import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-[800px] px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-foreground">
            Picre<span className="text-[#00F5FF]">AI</span>te
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-foreground">
            Welcome to PicreAIte
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in or create an account to continue
          </p>
        </div>

        <SignIn
          appearance={{
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
            variables: {
              colorPrimary: "#00F5FF",
              colorText: "#1A1E33",
              colorBackground: "#ffffff",
              colorInputBackground: "#ffffff",
              colorInputText: "#1A1E33",
              borderRadius: "0.5rem",
            },
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border dark:border-gray-700",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary:
                "bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-[#1A1E33] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 normal-case",
              footerActionLink:
                "text-[#00F5FF] hover:text-[#00F5FF]/80 font-medium",
              formFieldInput:
                "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#00F5FF] focus:border-[#00F5FF] dark:bg-[#0f1222] dark:text-gray-100",
              formFieldLabel: "dark:text-gray-300",
              socialButtonsBlockButton:
                "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#1a1f3a] dark:bg-[#0f1222] dark:text-gray-100",
              socialButtonsBlockButtonText: "font-medium dark:text-gray-100",
              socialButtonsProviderIcon: "dark:brightness-200",
              dividerLine: "bg-gray-300 dark:bg-gray-600",
              dividerText: "text-gray-500 dark:text-gray-400",
              formFieldInputShowPasswordButton:
                "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              identityPreviewText: "dark:text-gray-100",
              identityPreviewEditButton:
                "text-[#00F5FF] hover:text-[#00F5FF]/80",
              formHeaderTitle: "dark:text-gray-100",
              formHeaderSubtitle: "dark:text-gray-400",
              footerActionText: "dark:text-gray-400",
              footer: "dark:bg-transparent",
              footerAction: "dark:bg-transparent",
            },
          }}
        />
      </div>
    </div>
  );
}
