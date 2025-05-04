import { db } from "@/drizzle/db";
import { savedImages } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export class SavedImagesService {
  static async saveImage(
    userId: string,
    imageUrl: string,
    imageKey: string,
    name: string,
    imageType: string = "image"
  ): Promise<void> {
    try {
      await db.insert(savedImages).values({
        userId,
        imageUrl,
        imageKey,
        name,
        imageType,
      });
    } catch (error) {
      console.error("Error saving image to database:", error);
      throw new Error("Failed to save image to database");
    }
  }

  static async getUserImages(userId: string) {
    try {
      return db
        .select()
        .from(savedImages)
        .where(eq(savedImages.userId, userId))
        .orderBy(savedImages.createdAt);
    } catch (error) {
      throw new Error("Failed to fetch user images");
    }
  }

  static async deleteImage(id: number, userId: string) {
    try {
      const result = await db
        .delete(savedImages)
        .where(and(eq(savedImages.id, id), eq(savedImages.userId, userId)));

      return result;
    } catch (error) {
      throw new Error("Failed to delete image");
    }
  }
}
