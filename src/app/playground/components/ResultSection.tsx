import React, { useRef } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusOverlay } from "./StatusOverlay";

export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536";

interface ResultSectionProps {
  result: string | null;
  isLoading: boolean;
  error: string | null;
  size: SizeOption;
  promptName: string;
  onReset?: () => void;
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
  const downloadRef = useRef<HTMLAnchorElement>(null);

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

    const link = downloadRef.current || document.createElement("a");
    link.href = `data:image/png;base64,${result}`;
    link.download = `${promptName
      .replace(/\s+/g, "-")
      .toLowerCase()}-transformed.png`;
    link.click();
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
              <Image
                src={`data:image/png;base64,${result}`}
                alt="Generated image"
                fill
                className="object-contain"
                priority
              />
              <div className="absolute top-2 left-2 bg-[#00F5FF] text-[#1A1E33] text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                Transformed
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <div className={`flex gap-2 mt-3 ${isMobile ? "flex-col" : ""}`}>
          <Button
            onClick={handleDownload}
            className={`flex-1 bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 ${
              isMobile ? "h-9 text-xs" : "h-11 text-sm"
            } font-medium`}
          >
            <Download
              className={`${isMobile ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"}`}
            />
            {isMobile ? "Download" : "Download Image"}
          </Button>

          {onReset && (
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${
                isMobile ? "h-9 text-xs" : "h-11 text-sm"
              } font-medium`}
              onClick={onReset}
            >
              Create New
            </Button>
          )}
        </div>
      )}

      <a ref={downloadRef} className="hidden" />
    </div>
  );
}
