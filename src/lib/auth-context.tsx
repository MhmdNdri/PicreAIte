"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const checkAuth = async () => {
    const response = await fetch("/api/admin/auth/check");
    return response.ok;
  };

  const { data: isAuthenticated = false } = useQuery({
    queryKey: ["auth", "check"],
    queryFn: checkAuth,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "check"] });
      toast.success("Successfully logged in!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "check"] });
      toast.success("Successfully logged out!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const login = async (password: string) => {
    try {
      await loginMutation.mutateAsync(password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Error is already handled by the mutation
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
