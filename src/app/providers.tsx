"use client";

import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const baseProviders = (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider />
        {children}
      </ThemeProvider>
    </QueryProvider>
  );

  if (isHomePage) {
    return baseProviders;
  }

  return (
    <PostHogProvider>
      <ClerkProvider>{baseProviders}</ClerkProvider>
    </PostHogProvider>
  );
}
