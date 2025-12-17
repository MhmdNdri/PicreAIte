import Image from "next/image";
import { UploadSection } from "./UploadSection";
import { ResultSection } from "./ResultSection";

interface DesktopLayoutProps {
  prompt: {
    name: string;
    type: string;
    description: string | null;
    imageUrl: string | null;
    originalImage: string | null;
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
  selectedProvider?: "openai" | "openai-mini" | "gemini";
  usage?: {
    input_tokens: number;
    input_tokens_details: {
      image_tokens: number;
      text_tokens: number;
    };
    output_tokens: number;
    total_tokens: number;
  };
}

export function DesktopLayout({
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
  selectedProvider,
  usage,
}: DesktopLayoutProps) {
  return (
    <div className="hidden md:block p-6 border-b border-gray-100 dark:border-gray-800">
      {/* Main content container */}
      <div className="max-w-[1200px] mx-auto">
        {/* Style section - top row */}
        <div className="flex items-start gap-6 mb-8">
          {/* Original Image */}
          {prompt.originalImage && (
            <div className="w-[240px] shrink-0">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={prompt.originalImage}
                  alt="Original"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded">
                  Original
                </div>
              </div>
            </div>
          )}

          {/* Example Image */}
          <div className="w-[240px] shrink-0">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <Image
                src={prompt.imageUrl || ""}
                alt={prompt.name}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded">
                Transformed
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 pt-1">
            <h3 className="text-sm font-semibold mb-2">About This Style</h3>
            <p className="text-sm text-muted-foreground">
              {prompt.description ||
                "Transform your images with this unique style."}
            </p>
          </div>
        </div>

        {/* Upload and Result section - bottom row */}
        <div className="grid grid-cols-2 gap-8">
          {/* Upload section */}
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
            selectedProvider={selectedProvider}
          />

          {/* Result section */}
          <ResultSection
            result={result}
            isLoading={isLoading}
            error={error}
            size={size}
            promptName={prompt.name}
            onReset={onReset}
            usage={usage}
            selectedProvider={selectedProvider}
          />
        </div>
      </div>
    </div>
  );
}
