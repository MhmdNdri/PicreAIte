"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUploadThing } from "@/providers/uploadthing-provider";
import { toast } from "sonner";
import heicConvert from "heic-convert";

interface UploadImageButtonProps {
  imageData: string;
  onUploadComplete: (url: string, key: string) => void;
  className?: string;
  promptType?: string;
}

// Helper function to extract mime type from base64 data
const extractMimeType = (dataPart: string | undefined): string => {
  if (!dataPart?.includes(":")) return "image/png";

  const mimeParts = dataPart.split(":");
  if (mimeParts.length <= 1 || !mimeParts[1]?.includes(";")) return "image/png";

  const mimeType = mimeParts[1].split(";")[0];
  return mimeType || "image/png";
};

// Helper function to convert base64 to array buffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const byteString = window.atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return arrayBuffer;
};

// Helper function to generate file name
const generateFileName = (promptType: string): string => {
  const dateStr = new Date().toISOString().split("T")[0];
  const uniqueId = Math.random().toString(36).substring(2, 10);
  return `${promptType}_${dateStr}_${uniqueId}.png`;
};

export function UploadImageButton({
  imageData,
  onUploadComplete,
  className,
  promptType = "image",
}: UploadImageButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const { startUpload, isUploading: isUploadingUT } = useUploadThing(
    "generatedImageUploader"
  );

  // Memoize the button state
  const buttonState = useMemo(() => {
    if (isConverting) return { text: "Converting...", loading: true };
    if (isUploading || isUploadingUT)
      return { text: "Saving...", loading: true };
    return { text: "Save to Gallery", loading: false };
  }, [isConverting, isUploading, isUploadingUT]);

  const convertHeicToPng = useCallback(async (blob: Blob): Promise<Blob> => {
    const buffer = await blob.arrayBuffer();
    const pngBuffer = await heicConvert({
      buffer: Buffer.from(buffer),
      format: "PNG",
      quality: 1,
    });
    return new Blob([pngBuffer], { type: "image/png" });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!imageData || !imageData.includes(",")) {
      toast.error("Invalid image data");
      return;
    }

    try {
      setIsUploading(true);
      const [header, dataPart] = imageData.split(",");

      if (!dataPart) {
        toast.error("Invalid image data format");
        return;
      }

      const mimePart = extractMimeType(header);
      const arrayBuffer = base64ToArrayBuffer(dataPart);
      const fileName = generateFileName(promptType);

      let blob = new Blob([arrayBuffer], { type: mimePart });
      let file = new File([blob], fileName, { type: "image/png" });

      // Convert HEIC to PNG if needed
      if (mimePart.includes("heic")) {
        try {
          setIsConverting(true);
          blob = await convertHeicToPng(blob);
          file = new File([blob], fileName, { type: "image/png" });
        } catch (error) {
          console.error("Error converting HEIC to PNG:", error);
          toast.error("Failed to convert HEIC image");
          return;
        } finally {
          setIsConverting(false);
        }
      }

      const uploadResult = await startUpload([file]);

      if (!uploadResult?.[0]?.url) {
        toast.error("Upload response format unexpected");
        return;
      }

      const { url, key } = uploadResult[0];
      toast.success("Image saved to gallery");
      onUploadComplete(url, key);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  }, [imageData, startUpload, onUploadComplete, promptType, convertHeicToPng]);

  return (
    <Button
      onClick={handleUpload}
      disabled={buttonState.loading}
      className={className}
    >
      {buttonState.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonState.text}
    </Button>
  );
}
