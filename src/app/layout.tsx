import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PicreAIte",
  description: "Create and share your pictures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="pt-16 transition-all duration-300">
              <PageTransition>{children}</PageTransition>
            </main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
