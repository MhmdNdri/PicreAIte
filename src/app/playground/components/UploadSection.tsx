import {
  getImageModel,
  type ImageQuality,
  type ImageResolution,
  type ImageModelKey,
} from "@/lib/image-models";
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
import { useState, useCallback, useRef } from "react";

export type QualityOption = ImageQuality;
export type SizeOption = "1024x1024" | "1536x1024" | "1024x1536";

interface UploadSectionProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  quality: QualityOption;
  onQualityChange: (value: QualityOption) => void;
  resolution: ImageResolution;
  onResolutionChange: (value: ImageResolution) => void;
  size: SizeOption;
  onSizeChange: (value: SizeOption) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isMobile?: boolean;
  selectedProvider?: ImageModelKey;
}

const MAX_IMAGES = 1;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

export function isHeicFile(file: File): boolean {
  return (
    /image\/hei[cf](?:-sequence)?$/i.test(file.type) ||
    /\.hei[cf]$/i.test(file.name)
  );
}

export function supportedImageFile(file: File): File | null {
  if (isHeicFile(file)) return file;
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return file;
  // Some platforms leave the MIME type empty for otherwise supported files.
  if (!file.type) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mime =
      extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : null;
    if (mime) {
      return new File([file], file.name, {
        type: mime,
        lastModified: file.lastModified,
      });
    }
  }
  return null;
}

// Helper function to check file size
const isFileSizeValid = (file: File): boolean => {
  if (file.size === 0) {
    toast.error("This file is empty", {
      description: "Please choose an image with content.",
    });
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error("File too large", {
      description: "Please select images smaller than 4MB",
      icon: "❌",
    });
    return false;
  }
  return true;
};

// Helper function to progressively compress HEIC images
const compressHeicImage = async (file: File): Promise<File | null> => {
  try {
    // Use native browser encoders and avoid depending on Node's Buffer global.
    const { default: heicConvert } = await import("heic-convert/browser");
    const buffer = await file.arrayBuffer();
    let quality = 0.99; // Start with good quality
    let jpegBuffer: Uint8Array;

    // Try different quality levels until file is small enough
    do {
      jpegBuffer = await heicConvert({
        buffer: new Uint8Array(buffer),
        format: "JPEG",
        quality: quality,
      });

      if (jpegBuffer.length <= MAX_FILE_SIZE) {
        break; // File is small enough
      }

      quality -= 0.15; // Reduce quality by 15% each attempt

      // If quality gets too low, give up
      if (quality < 0.3) {
        toast.error("Image too large to compress", {
          description: `Even with maximum compression, this image exceeds 4MB. Please resize or choose a smaller image.`,
          icon: "❌",
        });
        return null;
      }
    } while (jpegBuffer.length > MAX_FILE_SIZE);

    const blob = new Blob([new Uint8Array(jpegBuffer)], { type: "image/jpeg" });
    const newFileName = `${file.name.replace(/\.hei[cf]$/i, "")}_${Math.round(quality * 100)}pct.jpg`;
    return new File([blob], newFileName, { type: "image/jpeg" });
  } catch (error) {
    console.error("Error compressing HEIC image:", error);
    toast.error("Failed to compress HEIC image", {
      description: "Please try with a different image or format.",
      icon: "❌",
    });
    return null;
  }
};

export function UploadSection({
  images,
  onImagesChange,
  onRemoveImage,
  quality,
  onQualityChange,
  resolution,
  onResolutionChange,
  size,
  onSizeChange,
  onSubmit,
  isLoading,
  isMobile = false,
  selectedProvider,
}: UploadSectionProps) {
  const [isConverting, setIsConverting] = useState(false);
  const processingFiles = useRef(false);
  const model = getImageModel(selectedProvider);
  const controlId = isMobile ? "mobile" : "desktop";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const addFiles = useCallback(
    async (filesArray: File[]) => {
      if (isLoading || processingFiles.current || filesArray.length === 0)
        return;
      const totalImages = images.length + filesArray.length;

      if (totalImages > MAX_IMAGES) {
        toast.error("Please select one image", {
          description: "Remove the current image before uploading another.",
          icon: "❌",
        });
        return;
      }

      const file = supportedImageFile(filesArray[0]!);
      if (!file) {
        toast.error("Unsupported image format", {
          description: "Choose a JPG, PNG, WebP, HEIC, or HEIF image.",
        });
        return;
      }
      if (!isFileSizeValid(file)) return;

      processingFiles.current = true;
      setIsConverting(isHeicFile(file));
      try {
        const processed = isHeicFile(file)
          ? await compressHeicImage(file)
          : file;
        if (processed) onImagesChange([...images, processed]);
      } finally {
        processingFiles.current = false;
        setIsConverting(false);
      }
    },
    [images, onImagesChange, isLoading],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      void addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.currentTarget.files ?? []);
      // Permit selecting the same file again after removing it or correcting an error.
      e.currentTarget.value = "";
      void addFiles(files);
    },
    [addFiles],
  );

  const isBusy = isLoading || isConverting;
  const remainingSlots = MAX_IMAGES - images.length;

  // Loading overlay component
  const LoadingOverlay = useCallback(
    () => (
      <div
        role="status"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Converting HEIC image...
          </p>
        </div>
      </div>
    ),
    [],
  );

  // Upload area content component
  const UploadAreaContent = useCallback(
    ({ isMobile }: { isMobile: boolean }) => (
      <div className="flex flex-col items-center">
        {isMobile ? (
          <>
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-xs text-muted-foreground">Tap to upload photo</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Drop your image here
            </p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG, WebP, HEIC or HEIF · Up to 4MB
              <br />
              HEIC and HEIF images are converted to JPEG.
            </p>
          </>
        )}
      </div>
    ),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Your Photo{" "}
          {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
        </h3>

        {remainingSlots > 0 && (
          <div
            className={`border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg ${
              isMobile ? "p-4" : "p-10"
            } text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative focus-within:ring-2 focus-within:ring-ring ${isBusy ? "opacity-60" : "cursor-pointer"}`}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
            style={{ touchAction: "pan-y" }}
          >
            {isConverting && <LoadingOverlay />}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={handleFileChange}
              className="sr-only"
              id={isMobile ? "mobile-image" : "desktop-image"}
              disabled={isBusy}
            />
            <label
              htmlFor={isMobile ? "mobile-image" : "desktop-image"}
              className={`cursor-pointer block ${
                isBusy ? "pointer-events-none" : ""
              }`}
            >
              <UploadAreaContent isMobile={isMobile} />
            </label>
            {isMobile && (
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG, WebP, HEIC or HEIF · Up to 4MB
              </p>
            )}
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
                type="button"
                size="sm"
                disabled={isBusy}
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
                src={img}
                alt={`Selected image ${index + 1}`}
                className="aspect-square"
                onRemove={() => onRemoveImage(index)}
                disabled={isBusy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Configuration options */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!!model?.qualities.length && (
            <div>
              <Label htmlFor={`${controlId}-quality`} className="mb-2 block">
                Quality
              </Label>
              <Select
                value={quality}
                onValueChange={onQualityChange}
                disabled={isBusy}
              >
                <SelectTrigger id={`${controlId}-quality`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {model.qualities.map((value) => (
                    <SelectItem key={value} value={value}>
                      {
                        {
                          low: "Low · quick drafts",
                          medium: "Medium",
                          high: "High",
                          xhigh: "Extra high",
                          max: "Maximum",
                        }[value]
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Higher quality can increase generation time and cost.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor={`${controlId}-size`} className="mb-2 block">
              Aspect ratio
            </Label>
            <Select value={size} onValueChange={onSizeChange} disabled={isBusy}>
              <SelectTrigger id={`${controlId}-size`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                <SelectItem value="1536x1024">Landscape (3:2)</SelectItem>
                <SelectItem value="1024x1536">Portrait (2:3)</SelectItem>
              </SelectContent>
            </Select>
            {model?.provider === "openai" && (
              <p className="mt-1 text-xs text-muted-foreground">
                {size} pixels
              </p>
            )}
          </div>
          {!!model?.resolutions.length && (
            <div>
              <Label htmlFor={`${controlId}-resolution`} className="mb-2 block">
                Resolution
              </Label>
              <Select
                value={resolution}
                onValueChange={onResolutionChange}
                disabled={isBusy || model.resolutions.length === 1}
              >
                <SelectTrigger id={`${controlId}-resolution`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {model.resolutions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {model.resolutions.length === 1
                  ? "This model outputs at 1K."
                  : "Larger outputs cost more; exact dimensions depend on aspect ratio."}
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            isLoading ||
            isConverting ||
            images.length === 0 ||
            !selectedProvider
          }
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
