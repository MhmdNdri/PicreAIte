import { UTApi } from "uploadthing/server";

// Initialize UploadThing API client
const utapi = new UTApi();

export class UploadThingService {
  static async deleteFile(fileKey: string) {
    try {
      await utapi.deleteFiles(fileKey);
    } catch (error) {
      console.error("Error deleting file from UploadThing:", error);
      throw new Error("Failed to delete file from UploadThing");
    }
  }
}
