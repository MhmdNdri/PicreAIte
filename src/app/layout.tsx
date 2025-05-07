import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "PicreAIte - AI-Powered Image Creation Platform",
  description:
    "Transform your images with AI - no prompts needed. Just choose your style and let the magic happen.",
  keywords: [
    "AI image creation",
    "image editing",
    "digital art",
    "AI art",
    "image sharing",
    "creative platform",
  ],
  authors: [{ name: "PicreAIte Team" }],
  creator: "PicreAIte",
  publisher: "PicreAIte",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://picre-a-ite.vercel.app"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#000000",
      },
    ],
  },
  manifest: "/site.webmanifest",
  applicationName: "PicreAIte",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PicreAIte",
  },
  openGraph: {
    title: "PicreAIte - AI-Powered Image Creation Platform",
    description:
      "Transform your images with AI - no prompts needed. Just choose your style and let the magic happen.",
    url: "https://picre-a-ite.vercel.app",
    siteName: "PicreAIte",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "PicreAIte Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
    yahoo: "your-yahoo-verification",
  },
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
