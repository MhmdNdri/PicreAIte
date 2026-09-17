import type { GeneratedImage } from "@/lib/image-result";
import { IMAGE_MIME_TYPES } from "@/lib/image-result";

export class ImageApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ImageApiError";
  }
}

export async function imageApiJson(
  url: string,
  init: RequestInit,
  provider: string,
) {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(280_000),
  });
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ImageApiError(
      response.ok ? 502 : response.status,
      `${provider} returned an invalid response. Please try again later.`,
    );
  }
  if (!json || typeof json !== "object") {
    throw new ImageApiError(502, `${provider} returned an invalid response.`);
  }
  if (!response.ok || json.error) {
    const message =
      typeof json.error?.message === "string"
        ? json.error.message
        : `${provider} image request failed.`;
    throw new ImageApiError(response.ok ? 502 : response.status, message);
  }
  return json;
}

export function generatedImage(
  imageBytes: unknown,
  mimeType: unknown,
  costUsd?: unknown,
): GeneratedImage {
  if (typeof imageBytes !== "string" || !imageBytes) {
    throw new ImageApiError(
      502,
      "The provider returned no image. Try a different prompt or image.",
    );
  }
  // Some providers omit media_type. Read the signature rather than relabel JPEG as PNG.
  let signature: string;
  try {
    signature = atob(imageBytes.slice(0, 32));
  } catch {
    throw new ImageApiError(502, "The provider returned invalid image data.");
  }
  if (signature.startsWith("\x89PNG\r\n\x1a\n")) mimeType = "image/png";
  else if (signature.startsWith("\xff\xd8\xff")) mimeType = "image/jpeg";
  else if (signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP")
    mimeType = "image/webp";
  else
    throw new ImageApiError(502, "The provider returned invalid image data.");
  if (
    typeof mimeType !== "string" ||
    !IMAGE_MIME_TYPES.some((type) => type === mimeType)
  ) {
    throw new ImageApiError(
      502,
      "The provider returned an unsupported image format.",
    );
  }
  return {
    imageBytes,
    mimeType,
    ...(typeof costUsd === "number" && Number.isFinite(costUsd) && costUsd >= 0
      ? { costUsd }
      : {}),
  };
}
