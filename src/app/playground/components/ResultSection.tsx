import {
  imageExtension,
  type ImageGenerationResponse,
} from "@/lib/image-result";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusOverlay } from "./StatusOverlay";
import { toast } from "sonner";
import { UploadImageButton } from "@/components/UploadImageButton";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerationCost } from "./GenerationCost";

export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536";

interface ResultSectionProps {
  result: string | null;
  isLoading: boolean;
  error: string | null;
  size: SizeOption;
  promptName: string;
  onReset: () => void;
  isMobile?: boolean;
  resultInfo?: ImageGenerationResponse;
}

export function ResultSection({
  result,
  isLoading,
  error,
  size,
  promptName,
  onReset,
  isMobile = false,
  resultInfo,
}: ResultSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const mimeType = resultInfo?.data[0]?.mime_type ?? "image/png";
  const dataUrl = result ? `data:${mimeType};base64,${result}` : "";
  useEffect(() => {
    setImageLoaded(false);
    setPreviewError(false);
  }, [result]);

  const getAspectRatioClass = (size: SizeOption): string => {
    switch (size) {
      case "1024x1024":
        return "aspect-square";
      case "1536x1024":
        return "aspect-[3/2]";
      case "1024x1536":
        return "aspect-[2/3]";
      default:
        return "aspect-square";
    }
  };

  const handleDownload = () => {
    if (!result) return;

    try {
      // Generate a unique ID for the filename
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${promptName}_${timestamp}_${uniqueId}.${imageExtension(mimeType)}`;

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    } catch {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold mb-4">Result</h3>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div
          className={`relative ${getAspectRatioClass(resultInfo?.settings?.size ?? size)} w-full`}
        >
          {!result && !isLoading && !error && (
            <StatusOverlay
              type="empty"
              message="Your transformed image will appear here"
              submessage="Upload and transform an image to see the result"
            />
          )}

          {isLoading && (
            <StatusOverlay
              type="loading"
              message="Processing your image..."
              submessage="Generation may take 2-5 minutes. Please wait..."
            />
          )}

          {error && (
            <StatusOverlay type="error" message="Error" submessage={error} />
          )}

          {result && !isLoading && !error && (
            <>
              {!imageLoaded && !previewError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
              )}
              <Image
                src={dataUrl}
                alt="Generated image"
                fill
                className={`object-contain transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                priority
                onLoad={() => setImageLoaded(true)}
                onError={() => setPreviewError(true)}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {previewError && (
                <StatusOverlay
                  type="error"
                  message="Preview could not be displayed"
                  submessage="You can still try downloading the image below."
                />
              )}
              <div className="absolute top-2 left-2 bg-[#00F5FF] text-[#1A1E33] text-xs font-medium px-2 py-1 rounded-md shadow-sm z-20">
                Transformed
              </div>
            </>
          )}
        </div>
      </div>

      {result && resultInfo && (
        <p className="text-xs text-muted-foreground break-words">
          Model used: {resultInfo.model} ·{" "}
          {resultInfo.provider === "openrouter" ? "OpenRouter" : "Direct API"}
        </p>
      )}
      {result && resultInfo?.cost && <GenerationCost cost={resultInfo.cost} />}

      {result && (
        <div
          className={`flex flex-wrap ${isMobile ? "flex-col" : "flex-row"} gap-2 mt-4`}
        >
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading}
            className={`flex items-center ${isMobile ? "w-full" : ""}`}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>

          <UploadImageButton
            imageData={dataUrl}
            disabled={isLoading}
            className={isMobile ? "w-full" : ""}
            promptType={promptName}
          />

          <Button
            variant="secondary"
            onClick={onReset}
            disabled={isLoading}
            className={`text-white ${isMobile ? "w-full mt-2" : "ml-auto"}`}
          >
            Make another
          </Button>
        </div>
      )}
    </div>
  );
}
