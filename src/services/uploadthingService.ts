import { UTApi } from "uploadthing/server";

// Initialize UploadThing API client
const utapi = new UTApi();

export class UploadThingService {
  static async uploadFile(
    imageData: Buffer,
    fileName: string,
    mimeType: string
  ) {
    try {
      const file = new File([imageData], fileName, { type: mimeType });
      const response = await utapi.uploadFiles(file);

      if (response.error) {
        throw new Error(`Upload failed: ${response.error.message}`);
      }

      return {
        key: response.data.key,
        url: response.data.url,
      };
    } catch (error) {
      throw new Error("Failed to upload file to UploadThing");
    }
  }

  static async deleteFile(fileKey: string) {
    try {
      await utapi.deleteFiles(fileKey);
    } catch (error) {
      throw new Error("Failed to delete file from UploadThing");
    }
  }
}
