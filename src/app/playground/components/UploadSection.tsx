import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "./ImagePreview";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heicConvert from "heic-convert";
import { useState, useCallback } from "react";

export type QualityOption = "low" | "medium" | "high";
export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536";

interface UploadSectionProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  quality: QualityOption;
  onQualityChange: (value: QualityOption) => void;
  size: SizeOption;
  onSizeChange: (value: SizeOption) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isMobile?: boolean;
}

const MAX_IMAGES = 1;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

// Helper function to check file size
const isFileSizeValid = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error("File too large", {
      description: "Please select images smaller than 4MB",
      icon: "❌",
    });
    return false;
  }
  return true;
};

// Helper function to convert HEIC to PNG
const convertHeicToPng = async (file: File): Promise<File | null> => {
  try {
    const buffer = await file.arrayBuffer();
    const pngBuffer = await heicConvert({
      buffer: Buffer.from(buffer),
      format: "PNG",
      quality: 1,
    });

    const blob = new Blob([pngBuffer], { type: "image/png" });
    const newFileName = file.name.replace(/\.heic$/i, ".png");
    return new File([blob], newFileName, { type: "image/png" });
  } catch (error) {
    console.error("Error converting HEIC to PNG:", error);
    toast.error("Failed to convert HEIC image");
    return null;
  }
};

export function UploadSection({
  images,
  onImagesChange,
  onRemoveImage,
  quality,
  onQualityChange,
  size,
  onSizeChange,
  onSubmit,
  isLoading,
  isMobile = false,
}: UploadSectionProps) {
  const [isConverting, setIsConverting] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.dataTransfer.files?.length) return;

      const filesArray = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (!filesArray.length) return;

      const totalImages = images.length + filesArray.length;
      if (totalImages > MAX_IMAGES) {
        toast.error(`You can only upload up to ${MAX_IMAGES} images`, {
          description: "Please remove some images first.",
          icon: "❌",
        });
        return;
      }

      const validFiles = filesArray.filter(isFileSizeValid);
      if (validFiles.length > 0) {
        onImagesChange([...images, ...validFiles]);
      }
    },
    [images, onImagesChange]
  );

  const processFiles = useCallback(async (files: File[]): Promise<File[]> => {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        if (!isFileSizeValid(file)) return null;

        if (file.type.includes("heic")) {
          return await convertHeicToPng(file);
        }
        return file;
      })
    );

    return processedFiles.filter((file): file is File => file !== null);
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const filesArray = Array.from(e.target.files);
      const totalImages = images.length + filesArray.length;

      if (totalImages > MAX_IMAGES) {
        toast.error(`You can only upload up to ${MAX_IMAGES} images`, {
          description: "Please remove some images first.",
          icon: "❌",
        });
        return;
      }

      const hasHeicFiles = filesArray.some((file) =>
        file.type.includes("heic")
      );
      if (hasHeicFiles) {
        setIsConverting(true);
      }

      try {
        const validFiles = await processFiles(filesArray);
        if (validFiles.length > 0) {
          onImagesChange([...images, ...validFiles]);
        }
      } finally {
        setIsConverting(false);
      }
    },
    [images, onImagesChange, processFiles]
  );

  const remainingSlots = MAX_IMAGES - images.length;

  // Loading overlay component
  const LoadingOverlay = useCallback(
    () => (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Converting HEIC image...
          </p>
        </div>
      </div>
    ),
    []
  );

  // Upload area content component
  const UploadAreaContent = useCallback(
    ({ isMobile }: { isMobile: boolean }) => (
      <div className="flex flex-col items-center">
        {isMobile ? (
          <>
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-xs text-muted-foreground">
              {images.length > 0
                ? "Tap to change photo"
                : "Tap to upload photo"}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {images.length > 0
                ? "Drop a new photo here to replace"
                : "Drop your image here"}
            </p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Upload your image (JPG, PNG, WebP, HEIC)
            </p>
          </>
        )}
      </div>
    ),
    [images.length]
  );

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Your Photos{" "}
          {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
        </h3>

        {remainingSlots > 0 && (
          <div
            className={`border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg ${
              isMobile ? "p-4" : "p-10"
            } text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative`}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
            style={{ touchAction: "pan-y" }}
          >
            {isConverting && <LoadingOverlay />}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={isMobile ? "mobile-image" : "desktop-image"}
              disabled={isConverting}
            />
            <label
              htmlFor={isMobile ? "mobile-image" : "desktop-image"}
              className={`cursor-pointer block ${
                isConverting ? "pointer-events-none" : ""
              }`}
            >
              <UploadAreaContent isMobile={isMobile} />
            </label>
          </div>
        )}
      </div>

      {/* Uploaded images */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Uploaded Image</p>
            {images.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImagesChange([])}
                className="h-8 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          <div
            className={`grid ${
              isMobile ? "grid-cols-4 gap-2" : "grid-cols-4 gap-3"
            }`}
          >
            {images.map((img, index) => (
              <ImagePreview
                key={index}
                src={URL.createObjectURL(img)}
                alt={`Selected image ${index + 1}`}
                className="aspect-square"
                onRemove={() => onRemoveImage(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Configuration options */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="quality" className="text-sm block mb-2">
              Quality
            </Label>
            <Select value={quality} onValueChange={onQualityChange}>
              <SelectTrigger
                id="quality"
                className={`${isMobile ? "h-9" : "h-10"}`}
              >
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Faster) ~ $0.01-0.05</SelectItem>
                <SelectItem value="medium">Medium ~ $0.05-0.15</SelectItem>
                <SelectItem value="high">
                  High (Recommended) ~ $0.15-0.40
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Higher quality takes slightly longer to process
            </p>
          </div>

          <div>
            <Label htmlFor="size" className="text-sm block mb-2">
              Output Size
            </Label>
            <Select value={size} onValueChange={onSizeChange}>
              <SelectTrigger
                id="size"
                className={`${isMobile ? "h-9" : "h-10"}`}
              >
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                <SelectItem value="1536x1024">Landscape (3:2)</SelectItem>
                <SelectItem value="1024x1536">Portrait (2:3)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose the aspect ratio for your result
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || images.length === 0}
          className={`w-full bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 ${
            isMobile ? "h-10" : "h-12"
          } text-sm font-medium`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1A1E33] mr-2"></div>
              Processing...
            </>
          ) : (
            "Transform Image"
          )}
        </Button>
      </form>
    </div>
  );
}
