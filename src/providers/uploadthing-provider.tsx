"use client";

import { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

// Create our uploadthing helpers
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

// Export components for convenience
export { UploadButton, UploadDropzone, Uploader };
