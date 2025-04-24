"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="fixed w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div
          className="flex items-center justify-between h-16 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-2xl px-6 shadow-lg border border-gray-200/10 dark:border-gray-700/10 animate-navbar-expand"
          style={{
            animation: "navbarExpand 1s ease-out forwards",
            transformOrigin: "center",
            opacity: 0,
          }}
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
              className="text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
            >
              Contact
            </Link>
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
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-[#E6F0FA] hover:font-bold transition-all duration-300"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
