"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/prompts"
            className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md p-6 rounded-lg border border-gray-200/10 dark:border-gray-700/10 hover:bg-white/90 dark:hover:bg-[#1A1E33]/90 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Manage Prompts</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage AI image transformation prompts
            </p>
          </Link>
          {/* Add more admin sections here */}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Example Stat Card 1 */}
          <div className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md overflow-hidden shadow-lg rounded-lg border border-gray-200/10 dark:border-gray-700/10">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#00F5FF] rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-[#1A1E33]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-semibold text-[#1A1E33] dark:text-[#E6F0FA]">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Example Stat Card 2 */}
          <div className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md overflow-hidden shadow-lg rounded-lg border border-gray-200/10 dark:border-gray-700/10">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#FF00A8] rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Images
                    </dt>
                    <dd className="text-lg font-semibold text-[#1A1E33] dark:text-[#E6F0FA]">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Example Stat Card 3 */}
          <div className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md overflow-hidden shadow-lg rounded-lg border border-gray-200/10 dark:border-gray-700/10">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#B4FF00] rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-[#1A1E33]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Generations
                    </dt>
                    <dd className="text-lg font-semibold text-[#1A1E33] dark:text-[#E6F0FA]">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md shadow-lg rounded-lg border border-gray-200/10 dark:border-gray-700/10">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-[#1A1E33] dark:text-[#E6F0FA]">
                Quick Actions
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/admin/prompts"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#1A1E33] bg-[#00F5FF] hover:bg-[#00F5FF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00F5FF] dark:focus:ring-offset-[#1A1E33]"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Manage Prompts
                </Link>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF00A8] hover:bg-[#FF00A8]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF00A8] dark:focus:ring-offset-[#1A1E33]">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
