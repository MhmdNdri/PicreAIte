import { db } from "@/drizzle/db";
import { savedImages } from "@/drizzle/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { UploadThingService } from "./uploadthingService";

export class SavedImagesService {
  static async saveImage(
    userId: string,
    imageUrl: string,
    imageKey: string,
    name: string,
    imageType: string = "image"
  ): Promise<void> {
    try {
      // Set expiration date to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      await db.insert(savedImages).values({
        userId,
        imageUrl,
        imageKey,
        name,
        imageType,
        expiresAt,
      });
    } catch (error) {
      console.error("Error saving image to database:", error);
      throw new Error("Failed to save image to database");
    }
  }

  static async getUserImages(userId: string) {
    try {
      const now = new Date();

      // First, get all images including expired ones
      const allImages = await db
        .select()
        .from(savedImages)
        .where(eq(savedImages.userId, userId))
        .orderBy(savedImages.createdAt);

      // Filter out expired images and collect their IDs
      const validImages = allImages.filter(
        (img) => new Date(img.expiresAt) > now
      );
      const expiredImageIds = allImages
        .filter((img) => new Date(img.expiresAt) <= now)
        .map((img) => img.id);

      // If there are expired images, delete them
      if (expiredImageIds.length > 0) {
        await db
          .delete(savedImages)
          .where(
            and(
              eq(savedImages.userId, userId),
              inArray(savedImages.id, expiredImageIds)
            )
          );
      }

      return validImages;
    } catch (error) {
      console.error("Error in getUserImages:", error);
      throw new Error("Failed to fetch user images");
    }
  }

  static async deleteImage(id: number, userId: string) {
    try {
      // First get the image to get its file key
      const [image] = await db
        .select()
        .from(savedImages)
        .where(and(eq(savedImages.id, id), eq(savedImages.userId, userId)));

      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from UploadThing first
      await UploadThingService.deleteFile(image.imageKey);

      // Then delete from database
      const result = await db
        .delete(savedImages)
        .where(and(eq(savedImages.id, id), eq(savedImages.userId, userId)));

      return result;
    } catch (error) {
      throw new Error("Failed to delete image");
    }
  }

  static async cleanupExpiredImages() {
    try {
      const now = new Date();

      // Get all expired images first
      const expiredImages = await db
        .select()
        .from(savedImages)
        .where(lt(savedImages.expiresAt, now));

      // Delete from UploadThing
      for (const image of expiredImages) {
        try {
          await UploadThingService.deleteFile(image.imageKey);
        } catch (error) {
          console.error(
            `Failed to delete file from UploadThing: ${image.imageKey}`,
            error
          );
          // Continue with other files even if one fails
        }
      }

      // Delete from database
      const result = await db
        .delete(savedImages)
        .where(lt(savedImages.expiresAt, now));

      return result;
    } catch (error) {
      console.error("Error cleaning up expired images:", error);
      throw new Error("Failed to clean up expired images");
    }
  }
}
