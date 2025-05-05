import React, { useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusOverlay } from "./StatusOverlay";
import { toast } from "sonner";
import { UploadImageButton } from "@/components/UploadImageButton";
import { Skeleton } from "@/components/ui/skeleton";

export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536";

interface ResultSectionProps {
  result: string | null;
  isLoading: boolean;
  error: string | null;
  size: SizeOption;
  promptName: string;
  onReset: () => void;
  isMobile?: boolean;
}

export function ResultSection({
  result,
  isLoading,
  error,
  size,
  promptName,
  onReset,
  isMobile = false,
}: ResultSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

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
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${result}`;
      link.download = `${promptName}-generated.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  // Empty function as UploadImageButton already shows a toast
  const handleSaveToGallery = (url: string, key: string) => {
    // The toast is already shown in the UploadImageButton component
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold mb-4">Result</h3>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className={`relative ${getAspectRatioClass(size)} w-full`}>
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
              submessage="This may take a few moments"
            />
          )}

          {error && (
            <StatusOverlay type="error" message="Error" submessage={error} />
          )}

          {result && (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
              )}
              <Image
                src={`data:image/png;base64,${result}`}
                alt="Generated image"
                fill
                className={`object-contain transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                priority
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute top-2 left-2 bg-[#00F5FF] text-[#1A1E33] text-xs font-medium px-2 py-1 rounded-md shadow-sm z-20">
                Transformed
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <div
          className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-2 mt-4`}
        >
          <Button
            variant="outline"
            onClick={handleDownload}
            className={`flex items-center ${isMobile ? "w-full" : ""}`}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>

          <UploadImageButton
            imageData={`data:image/png;base64,${result}`}
            onUploadComplete={handleSaveToGallery}
            className={isMobile ? "w-full" : ""}
            promptType={promptName}
          />

          <Button
            variant="secondary"
            onClick={onReset}
            className={isMobile ? "w-full mt-2" : "ml-auto"}
          >
            Make another
          </Button>
        </div>
      )}
    </div>
  );
}
