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
      // Buffer isn't always typed as a valid BlobPart in TS DOM libs.
      // Convert to Uint8Array to satisfy the File constructor types.
      const file = new File([new Uint8Array(imageData)], fileName, {
        type: mimeType,
      });
      const response = await utapi.uploadFiles(file);

      if (response.error) {
        throw new Error(`Upload failed: ${response.error.message}`);
      }

      return {
        key: response.data.key,
        url: response.data.url,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error("Failed to upload file to UploadThing", {
        cause: error as any,
      });
    }
  }

  static async deleteFile(fileKey: string) {
    try {
      await utapi.deleteFiles(fileKey);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error("Failed to delete file from UploadThing", {
        cause: error as any,
      });
    }
  }
}
