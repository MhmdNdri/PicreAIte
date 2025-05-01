import React from "react";
import Image from "next/image";
import { UploadSection } from "./UploadSection";
import { ResultSection } from "./ResultSection";

interface MobileLayoutProps {
  prompt: {
    name: string;
    type: string;
    description: string | null;
    imageUrl: string | null;
  };
  images: File[];
  onImagesChange: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  quality: "low" | "medium" | "high";
  onQualityChange: (value: "low" | "medium" | "high") => void;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  onSizeChange: (value: "1024x1024" | "1536x1024" | "1024x1536") => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  result: string | null;
  error: string | null;
  onReset: () => void;
}

export function MobileLayout({
  prompt,
  images,
  onImagesChange,
  onRemoveImage,
  quality,
  onQualityChange,
  size,
  onSizeChange,
  onSubmit,
  isLoading,
  result,
  error,
  onReset,
}: MobileLayoutProps) {
  return (
    <div className="md:hidden px-4 py-4 space-y-6">
      {/* Prompt preview */}
      {prompt.imageUrl && (
        <div className="space-y-2">
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={prompt.imageUrl}
              alt={prompt.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              Example
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {prompt.description ||
              "Transform your images with this unique style."}
          </p>
        </div>
      )}

      {/* Upload section */}
      <div className="w-full">
        <UploadSection
          images={images}
          onImagesChange={onImagesChange}
          onRemoveImage={onRemoveImage}
          quality={quality}
          onQualityChange={onQualityChange}
          size={size}
          onSizeChange={onSizeChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          isMobile={true}
        />
      </div>

      {/* Result */}
      <ResultSection
        result={result}
        isLoading={isLoading}
        error={error}
        size={size}
        promptName={prompt.name}
        onReset={onReset}
        isMobile={true}
      />
    </div>
  );
}
