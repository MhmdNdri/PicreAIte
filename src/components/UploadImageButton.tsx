"use client";

import { IMAGE_MIME_TYPES, imageExtension } from "@/lib/image-result";
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUploadThing } from "@/providers/uploadthing-provider";
import { toast } from "sonner";

interface UploadImageButtonProps {
  imageData: string;
  onUploadComplete?: (url: string, key: string) => void;
  className?: string;
  promptType?: string;
  disabled?: boolean;
}

export function generatedImageFile(
  imageData: string,
  promptType: string,
): File {
  const match = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    imageData,
  );
  const mimeType = match?.[1];
  const encoded = match?.[2];
  if (
    !mimeType ||
    !encoded ||
    !IMAGE_MIME_TYPES.some((type) => type === mimeType)
  ) {
    throw new Error(
      "This image cannot be saved. Generate a PNG, JPG, or WebP image.",
    );
  }
  const bytes = Uint8Array.from(atob(encoded), (character) =>
    character.charCodeAt(0),
  );
  const dateStr = new Date().toISOString().split("T")[0];
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const safeName =
    promptType.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 100) ||
    "image";
  return new File(
    [bytes],
    `${safeName}_${dateStr}_${uniqueId}.${imageExtension(mimeType)}`,
    { type: mimeType },
  );
}

export function UploadImageButton({
  imageData,
  onUploadComplete,
  className,
  promptType = "image",
  disabled = false,
}: UploadImageButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const uploading = useRef(false);
  const [savedImage, setSavedImage] = useState<string | null>(null);

  const { startUpload, isUploading: isUploadingUT } = useUploadThing(
    "generatedImageUploader",
  );

  const loading = isUploading || isUploadingUT;
  const isSaved = savedImage === imageData;

  const handleUpload = useCallback(async () => {
    if (disabled || uploading.current || isUploadingUT || isSaved) return;

    try {
      uploading.current = true;
      setIsUploading(true);
      const file = generatedImageFile(imageData, promptType);
      if (file.size > 8 * 1024 * 1024) {
        toast.error("This image exceeds the gallery's 8MB limit", {
          description: "Use Download to keep the full-quality image.",
        });
        return;
      }

      const uploadResult = await startUpload([file]);

      if (!uploadResult?.[0]?.url) {
        toast.error("Upload response format unexpected");
        return;
      }

      const { url, key } = uploadResult[0];
      setSavedImage(imageData);
      toast.success("Image saved to gallery");
      onUploadComplete?.(url, key);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Error uploading image",
      );
    } finally {
      uploading.current = false;
      setIsUploading(false);
    }
  }, [
    imageData,
    startUpload,
    onUploadComplete,
    promptType,
    disabled,
    isUploadingUT,
    isSaved,
  ]);

  return (
    <Button
      type="button"
      onClick={handleUpload}
      disabled={disabled || loading || isSaved || !imageData}
      aria-busy={loading}
      className={className}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? "Saving..." : isSaved ? "Saved to Gallery" : "Save to Gallery"}
    </Button>
  );
}
