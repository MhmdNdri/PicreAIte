"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUploadThing } from "@/providers/uploadthing-provider";
import { toast } from "sonner";

interface UploadImageButtonProps {
  imageData: string; // Base64 image data
  onUploadComplete: (url: string, key: string) => void;
  className?: string;
  promptType?: string; // Add prompt type
}

export function UploadImageButton({
  imageData,
  onUploadComplete,
  className,
  promptType = "image", // Default to "image" if not provided
}: UploadImageButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Initialize the uploadthing client
  const { startUpload, isUploading: isUploadingUT } = useUploadThing(
    "generatedImageUploader"
  );

  const handleUpload = useCallback(async () => {
    if (!imageData || !imageData.includes(",")) {
      toast.error("Invalid image data");
      return;
    }

    try {
      setIsUploading(true);

      // Convert base64 to Blob
      const parts = imageData.split(",");
      if (parts.length !== 2) {
        toast.error("Invalid image data format");
        return;
      }

      // Make sure we have valid parts
      const dataPart = parts[1];

      // Safely extract mime type
      let mimePart = "image/png"; // Default mime type
      if (parts[0] && parts[0].includes(":")) {
        const mimeParts = parts[0].split(":");
        if (
          mimeParts.length > 1 &&
          mimeParts[1] &&
          mimeParts[1].includes(";")
        ) {
          const mimeType = mimeParts[1].split(";")[0];
          if (mimeType) {
            mimePart = mimeType;
          }
        }
      }

      if (!dataPart) {
        toast.error("Invalid image data format");
        return;
      }

      const byteString = window.atob(dataPart);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // Generate current date in YYYY-MM-DD format
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      // Generate a unique ID for this image
      const uniqueId = Math.random().toString(36).substring(2, 10);

      // Create a standardized file name: PromptType_Date_UniqueID.png
      const fileName = `${promptType}_${dateStr}_${uniqueId}.png`;

      const blob = new Blob([ab], { type: mimePart });
      const file = new File([blob], fileName, {
        type: "image/png",
      });

      // Upload the file
      const uploadResult = await startUpload([file]);

      if (uploadResult && uploadResult.length > 0) {
        const fileData = uploadResult[0];

        // Check for the response format
        try {
          if (fileData && fileData.url) {
            toast.success("Image saved to gallery");
            onUploadComplete(fileData.url, fileData.key);
          } else {
            toast.error("Upload response format unexpected");
          }
        } catch (err) {
          console.error("Error processing upload result:", err);
          toast.error("Error processing upload result");
        }
      }
    } catch (error) {
      toast.error("Error uploading image");
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  }, [imageData, startUpload, onUploadComplete, promptType]);

  return (
    <Button
      onClick={handleUpload}
      disabled={isUploading || isUploadingUT}
      className={className}
    >
      {isUploading || isUploadingUT ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save to Gallery"
      )}
    </Button>
  );
}
