import React from "react";

interface HeaderSectionProps {
  title: string;
  subtitle: string;
  description: string;
}

export function HeaderSection({
  title = "Transform Your Photos",
  subtitle = "Select a style that speaks to you",
  description = "Each style has its own magic - find the one that matches your vision",
}: HeaderSectionProps) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-12">
      <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-[#1A1E33] dark:text-[#E6F0FA]">
        {title}
      </h1>
      <p className="text-sm sm:text-lg text-muted-foreground mb-2">
        {subtitle}
      </p>
      <p className="text-xs sm:text-base text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
