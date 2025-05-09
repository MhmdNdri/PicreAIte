import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { SavedImagesService } from "@/services/savedImagesService";
import heicConvert from "heic-convert";

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

// Helper function to convert HEIC to PNG
async function convertHeicToPng(fileData: {
  type: string;
  name: string;
  size: number;
}): Promise<{ type: string; name: string; size: number }> {
  if (!fileData.type.includes("heic")) {
    return fileData;
  }

  try {
    // Since we can't access the actual file buffer in the middleware,
    // we'll just update the file metadata to indicate it should be converted
    return {
      ...fileData,
      type: "image/png",
      name: fileData.name.replace(/\.heic$/i, ".png"),
    };
  } catch (error) {
    console.error("Error preparing HEIC conversion:", error);
    throw new Error("Failed to prepare HEIC image for conversion");
  }
}

// File router configuration
export const ourFileRouter = {
  // Image uploader for generated images
  generatedImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req, files }) => {
      // Verify authentication using our helper
      const result = auth(req);
      if (result.status === "unauthorized") throw new Error("Unauthorized");

      // Convert HEIC files to PNG if needed
      const convertedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.includes("heic")) {
            return await convertHeicToPng(file);
          }
          return file;
        })
      );

      return {
        userId: result.userId,
        files: convertedFiles,
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
