import type {
  ApiKeySource,
  ImageSize,
  ImageResolution,
  ImageQuality,
} from "./image-models";
import type { ImageCost } from "./image-pricing";

export interface ImageGenerationResponse {
  data: { b64_json: string; mime_type: string }[];
  model: string;
  provider: ApiKeySource;
  costUsd?: number;
  cost: ImageCost;
  settings: {
    size: ImageSize;
    resolution: ImageResolution;
    quality: ImageQuality;
  };
}

export interface GeneratedImage {
  imageBytes: string;
  mimeType: string;
  costUsd?: number;
  cost?: ImageCost;
}

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function imageExtension(mimeType: string): string {
  return mimeType === "image/jpeg"
    ? "jpg"
    : mimeType === "image/webp"
      ? "webp"
      : "png";
}
