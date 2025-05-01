import { Upload } from "lucide-react";
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

const MAX_IMAGES = 5;

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
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (filesArray.length) {
        const totalImages = images.length + filesArray.length;
        if (totalImages > MAX_IMAGES) {
          toast.error(`You can only upload up to ${MAX_IMAGES} images`, {
            description: "Please remove some images first.",
          });
          return;
        }
        onImagesChange([...images, ...filesArray]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const totalImages = images.length + filesArray.length;
      if (totalImages > MAX_IMAGES) {
        toast.error(`You can only upload up to ${MAX_IMAGES} images`, {
          description: "Please remove some images first.",
        });
        return;
      }
      onImagesChange([...images, ...filesArray]);
    }
  };

  const remainingSlots = MAX_IMAGES - images.length;

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Your Photos{" "}
          {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
        </h3>

        {remainingSlots > 0 ? (
          <div
            className={`border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg ${
              isMobile ? "p-4" : "p-10"
            } text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={isMobile ? "mobile-image" : "desktop-image"}
              multiple
            />
            <label
              htmlFor={isMobile ? "mobile-image" : "desktop-image"}
              className="cursor-pointer block"
            >
              {isMobile ? (
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {images.length > 0
                      ? "Tap to add more photos (optional)"
                      : "Tap to upload photos"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {images.length > 0
                      ? "Drop more photos here (optional)"
                      : "Drop your images here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload up to {MAX_IMAGES} images (JPG, PNG, WebP)
                  </p>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Maximum number of images reached ({MAX_IMAGES})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please remove some images to upload more
            </p>
          </div>
        )}
      </div>

      {/* Uploaded images */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Uploaded Images ({images.length}/{MAX_IMAGES})
            </p>
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
                badge={`#${index + 1}`}
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
                <SelectItem value="low">Low (Faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Recommended)</SelectItem>
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
