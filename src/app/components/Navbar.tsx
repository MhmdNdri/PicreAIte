"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, Image, Palette, Key, Home } from "lucide-react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "./ProfileMenu";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    setMounted(true);
    if (isHomePage) {
      // Start with an invisible navbar
      setTimeout(() => {
        setAnimationComplete(true);
      }, 800); // Wait for page load before starting animation
    } else {
      setAnimationComplete(true);
    }
  }, [isHomePage]);

  if (!mounted) return null;

  // Calculate animation styles based on whether we're on the home page and animation status
  const navbarStyle =
    isHomePage && !animationComplete
      ? {
          transform: "scaleX(0)",
          opacity: 0,
        }
      : {
          transform: "scaleX(1)",
          opacity: 1,
          transition:
            "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease-in-out",
          transformOrigin: "center",
        };

  return (
    <nav className="fixed w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div
          style={navbarStyle}
          className="flex items-center justify-between h-16 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-2xl px-6 shadow-lg border border-gray-200/10 dark:border-gray-700/10"
        >
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-[#00F5FF] hover:font-extrabold transition-all duration-300"
              style={{
                textShadow: "2px 2px 4px rgba(0, 245, 255, 0.3)",
              }}
            >
              PicreAIte
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            {isSignedIn && (
              <>
                <Link
                  href="/playground"
                  className="flex items-center gap-2 text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                >
                  <Palette className="h-5 w-5" />
                  Playground
                </Link>
                <Link
                  href="/gallery"
                  className="flex items-center gap-2 text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                >
                  <Image className="h-5 w-5" />
                  Gallery
                </Link>
                <Link
                  href="/api-key"
                  className="flex items-center gap-2 text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                >
                  <Key className="h-5 w-5" />
                  API Key
                </Link>
              </>
            )}
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 font-medium text-sm hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_0_0_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_0_0_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-700">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <ProfileMenu />
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 shadow-md hover:shadow-lg"
              style={{
                boxShadow:
                  theme === "dark"
                    ? "0 4px 6px -1px rgba(180, 255, 0, 0.2), 0 2px 4px -1px rgba(180, 255, 0, 0.1)"
                    : "0 4px 6px -1px rgba(26, 30, 51, 0.2), 0 2px 4px -1px rgba(26, 30, 51, 0.1)",
              }}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-[#B4FF00]" />
              ) : (
                <Moon className="h-5 w-5 text-[#1A1E33]" />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 font-medium text-sm hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_0_0_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_0_0_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-700 mr-4">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <div className="mr-4 mt-2">
                <ProfileMenu />
              </div>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 shadow-md hover:shadow-lg mr-4"
              style={{
                boxShadow:
                  theme === "dark"
                    ? "0 4px 6px -1px rgba(180, 255, 0, 0.2), 0 2px 4px -1px rgba(180, 255, 0, 0.1)"
                    : "0 4px 6px -1px rgba(26, 30, 51, 0.2), 0 2px 4px -1px rgba(26, 30, 51, 0.1)",
              }}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-[#B4FF00]" />
              ) : (
                <Moon className="h-5 w-5 text-[#1A1E33]" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 shadow-md hover:shadow-lg"
              style={{
                boxShadow:
                  theme === "dark"
                    ? "0 4px 6px -1px rgba(180, 255, 0, 0.2), 0 2px 4px -1px rgba(180, 255, 0, 0.1)"
                    : "0 4px 6px -1px rgba(26, 30, 51, 0.2), 0 2px 4px -1px rgba(26, 30, 51, 0.1)",
              }}
            >
              {isOpen ? (
                <X className="h-5 w-5 text-gray-700 dark:text-[#E6F0FA]" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700 dark:text-[#E6F0FA]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden ${
          isOpen ? "block" : "hidden"
        } transition-all duration-300 ease-in-out transform origin-top`}
        style={{
          transform: isOpen ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
        }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/90 dark:bg-[#1A1E33]/90 backdrop-blur-md shadow-lg border-t border-gray-200/20 dark:border-gray-700/20 rounded-b-2xl mx-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
            onClick={() => setIsOpen(false)}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>
          {isSignedIn && (
            <>
              <Link
                href="/playground"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <Palette className="h-5 w-5" />
                Playground
              </Link>
              <Link
                href="/gallery"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <Image className="h-5 w-5" />
                Gallery
              </Link>
              <Link
                href="/api-key"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <Key className="h-5 w-5" />
                API Key
              </Link>
            </>
          )}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="w-full text-left px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 font-medium text-sm hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-900 dark:hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_0_0_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_0_0_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-700">
                Sign In
              </button>
            </SignInButton>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
