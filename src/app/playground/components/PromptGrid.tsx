import React from "react";
import { PromptCard } from "./PromptCard";

interface Prompt {
  id: string;
  name: string;
  type: string;
  promptDesc: string;
  description: string | null;
  imageUrl: string | null;
  orginal_Image: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface PromptGridProps {
  prompts: Prompt[];
  className?: string;
}

export function PromptGrid({ prompts, className = "" }: PromptGridProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          name={prompt.name}
          type={prompt.type}
          imageUrl={prompt.imageUrl || ""}
          orginal_Image={prompt.orginal_Image || ""}
        />
      ))}
    </div>
  );
}
