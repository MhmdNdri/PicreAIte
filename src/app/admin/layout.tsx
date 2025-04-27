"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const AdminContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-background to-muted">
    {children}
  </div>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname.includes("/admin/login");
  const shouldRedirect = !isAuthenticated && !isLoginPage;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (shouldRedirect) {
        router.push("/admin/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router, shouldRedirect]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (shouldRedirect) {
    return null;
  }

  return <AdminContainer>{children}</AdminContainer>;
}
