"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

// Import components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GalleryImage {
  imageUrl: string;
  name?: string;
  expiresAt: string;
}

// Function to fetch user's gallery images
async function fetchGalleryImages() {
  const response = await fetch("/api/gallery");
  if (!response.ok) {
    throw new Error("Failed to fetch gallery images");
  }
  return response.json();
}

// Function to delete image from gallery
async function deleteImage(imageId: number) {
  const response = await fetch("/api/gallery", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete image");
  }

  return response.json();
}

// Helper function to extract prompt type from file name
function extractPromptType(fileName: string | null | undefined): string {
  if (!fileName) return "Unknown";

  // Simple version - just take the first part before underscore if it exists
  const firstPart = fileName.split("_")[0];
  if (firstPart) {
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  }

  return "Image";
}

// Add a new component for ImageCard with loading state
interface ImageCardProps {
  image: any;
  onDeleteClick: (e: React.MouseEvent, id: number) => void;
  isDeleting: boolean;
  onImageClick: (image: any) => void;
}

function ImageCard({
  image,
  onDeleteClick,
  isDeleting,
  onImageClick,
}: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Function to extract prompt type from file name
  const promptType = extractPromptType(image.name);

  // Calculate time remaining
  const expiresAt = new Date(image.expiresAt);
  const now = new Date();
  const timeRemaining = expiresAt.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
  );

  // Format creation time
  const createdAt = new Date(image.createdAt);
  const formattedCreatedAt = createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      key={image.id}
      className="overflow-hidden group cursor-pointer transition-all hover:shadow-md"
      onClick={() => onImageClick(image)}
      style={{ touchAction: "pan-y" }}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          <Image
            src={image.imageUrl}
            alt={image.name || "Saved image"}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />
          {/* Delete button overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => onDeleteClick(e, image.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* Expiration overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-medium">{promptType}</span>
              <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full">
                {hoursRemaining}h {minutesRemaining}m
              </span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="text-muted-foreground text-xs">
            Created {formattedCreatedAt}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GalleryPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
    enabled: !!userId,
  });

  // Mutation for deleting images
  const { mutate: deleteImageMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      toast.success("Image deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setSelectedImage(null);
    },
    onError: (error) => {
      toast.error("Failed to delete image");
      console.error("Error deleting image:", error);
    },
  });

  // Redirect if user is not authenticated (do it in an effect to avoid render-time navigation).
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Failed to load gallery"}
          </p>
        </div>
      </div>
    );
  }

  // While auth/query load, render the page shell + skeletons (better perceived navigation speed).
  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Gallery</h1>
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
            Images expire 24 hours after creation
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="p-3">
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!data?.images || data.images.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Gallery</h1>
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-muted/30 rounded-lg p-8">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">No saved images yet</h2>
            <p className="text-muted-foreground mb-4">
              Generate and save some images to see them in your gallery.
            </p>
            <button
              onClick={() => router.push("/playground")}
              className="px-4 py-2 bg-[#00F5FF] text-[#1A1E33] rounded-md font-medium hover:bg-[#00F5FF]/90 transition-colors"
            >
              Go to Playground
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteImage = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation(); // Prevent opening the modal
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImageMutation(imageId);
    }
  };

  const handleDownloadImage = async (
    e: React.MouseEvent,
    image: GalleryImage
  ) => {
    e.stopPropagation();

    try {
      // Fetch the image first
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Generate a unique ID for the filename
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${image.name || "image"}_${timestamp}_${uniqueId}.png`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download image"
      );
    }
  };

  return (
    <div className="container mx-auto px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Gallery</h1>
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
          Images expire 24 hours after creation
        </div>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.images.map((image: any) => (
          <ImageCard
            key={image.id}
            image={image}
            onDeleteClick={handleDeleteImage}
            isDeleting={isDeleting}
            onImageClick={setSelectedImage}
          />
        ))}
      </div>

      {/* Modal for viewing full image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {extractPromptType(selectedImage.name)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created on{" "}
                  {new Date(selectedImage.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal body */}
            <div className="flex-1 relative overflow-auto p-4">
              <div className="relative w-full max-h-[60vh] flex items-center justify-center">
                {/* Skeleton loader will show until image is loaded */}
                <div className="relative w-full aspect-square max-h-[60vh]">
                  <Skeleton className="absolute inset-0 rounded-md" />
                  <Image
                    src={selectedImage.imageUrl}
                    alt={selectedImage.name || "Saved image"}
                    width={800}
                    height={800}
                    className="rounded object-contain max-h-[60vh] max-w-full relative z-10"
                    style={{ width: "auto", height: "auto" }}
                    sizes="80vw"
                    priority
                    onLoad={(e) => {
                      // Show image once loaded by making the target fully opaque
                      (e.target as HTMLImageElement).style.opacity = "1";
                    }}
                    // Start with opacity 0
                    onLoadStart={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                    // Add transition
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "1";
                    }}
                  />
                </div>
              </div>

              {/* Image details */}
              <div className="mt-4 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Type:</span>{" "}
                  {extractPromptType(selectedImage.name)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">ID:</span> {selectedImage.id}
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-between items-center p-4 border-t">
              <Button
                variant="outline"
                className="gap-2"
                onClick={(e) => handleDownloadImage(e, selectedImage)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>

              <Button
                variant="destructive"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this image?")) {
                    deleteImageMutation(selectedImage.id);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
