import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-[800px] px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-foreground">
            Picre<span className="text-primary">AI</span>te
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
            elements: {
              rootBox:
                "w-full [&>div]:!bg-transparent [&>div]:dark:!bg-transparent",
              card: "shadow-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary:
                "bg-transparent hover:bg-primary/10 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-md backdrop-blur-sm border border-primary/20",
              footerActionLink: "text-primary hover:text-primary/90",
              formFieldInput: "bg-background text-foreground",
              formFieldLabel: "text-foreground",
              socialButtonsBlockButton:
                "bg-background hover:bg-accent text-foreground dark:bg-background dark:hover:bg-accent dark:text-foreground",
              socialButtonsBlockButtonText:
                "text-foreground dark:text-foreground",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              cardBox: "!bg-transparent dark:!bg-transparent",
              main: "!bg-transparent dark:!bg-transparent",
              footerActionText: "text-muted-foreground",
              footer: "!bg-transparent dark:!bg-transparent",
              footerAction: "text-muted-foreground",
              footerBox:
                "!bg-transparent dark:!bg-transparent [&>div]:!bg-transparent [&>div]:dark:!bg-transparent [&_.cl-internal-4x6jej]:!bg-transparent [&_.cl-internal-4x6jej]:dark:!bg-transparent",
            },
          }}
        />
      </div>
    </div>
  );
}
