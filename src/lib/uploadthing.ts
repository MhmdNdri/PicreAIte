import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { SavedImagesService } from "@/services/savedImagesService";

// Initialize uploadthing
// Environment variables are automatically loaded from .env:
// - UPLOADTHING_SECRET: Your uploadthing secret key
// - UPLOADTHING_TOKEN: Your uploadthing token
const f = createUploadthing();

// Authentication helper
const auth = (req: NextRequest) => {
  const { userId } = getAuth(req);
  if (!userId) return { status: "unauthorized" };
  return { userId };
};

// File router configuration
export const ourFileRouter = {
  // Image uploader for generated images
  generatedImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Verify authentication using our helper
      const result = auth(req);
      if (result.status === "unauthorized") throw new Error("Unauthorized");

      return {
        userId: result.userId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Ensure we have values for required fields
      if (!metadata.userId) {
        throw new Error("User ID is required");
      }

      // Store file info in database
      try {
        await SavedImagesService.saveImage(
          metadata.userId,
          file.url,
          file.key,
          file.name || "generated-image",
          "image" // Default imageType - will be displayed from filename in the UI
        );
        return { uploadedImageUrl: file.url, fileKey: file.key };
      } catch (error) {
        console.error("Error saving image to database:", error);
        throw new Error("Failed to save image information");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
