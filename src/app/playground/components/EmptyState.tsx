import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  className?: string;
}

export function EmptyState({
  title = "No Styles Available Yet",
  message = "We're working on adding more styles. Check back soon for new creative options!",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`max-w-2xl mx-auto p-4 sm:p-6 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none text-center ${className}`}
    >
      <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-[#1A1E33] dark:text-[#E6F0FA]">
        {title}
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground">{message}</p>
    </div>
  );
}
