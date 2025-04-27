import { Inter } from "next/font/google";
import { Providers } from "../providers";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <Providers>{children}</Providers>
    </div>
  );
}
