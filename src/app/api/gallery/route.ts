import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { SavedImagesService } from "@/services/savedImagesService";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's saved images
    const images = await SavedImagesService.getUserImages(userId);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery images" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests to remove an image
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the image ID from the request
    const data = await request.json();
    const imageId = data.imageId;

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    try {
      // Delete the image from both database and UploadThing
      await SavedImagesService.deleteImage(parseInt(imageId), userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      // If the error is about the image not being found, return 404
      if (error instanceof Error && error.message === "Image not found") {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      // For other errors, return 500
      throw error;
    }
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery image" },
      { status: 500 }
    );
  }
}
