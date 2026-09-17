import { z } from "zod";
import {
  IMAGE_MODELS,
  IMAGE_MODEL_KEYS,
  getImageModel,
  ASPECT_RATIO_BY_SIZE,
  type ImageProvider,
} from "./image-models";
import { IMAGE_MIME_TYPES } from "./image-result";
import { ImageApiError } from "@/services/imageApi";

const schema = z.object({
  model: z.enum(IMAGE_MODEL_KEYS),
  apiKey: z.string().trim().min(1, "An API key is required"),
  prompt: z.string().trim().min(1, "A prompt is required"),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
  resolution: z.enum(["1K", "2K", "4K"]).default("1K"),
  keySource: z.enum(["openai", "gemini", "grok", "openrouter"]).optional(),
  n: z.coerce.number().int().min(1).max(1).default(1),
});

export type ImageEditRequest = ReturnType<typeof parseImageRequest>;

export function parseImageRequest(form: FormData, provider: ImageProvider) {
  const rawModel = form.get("model");
  const modelKey = IMAGE_MODEL_KEYS.find(
    (key) => key === rawModel || IMAGE_MODELS[key].id === rawModel,
  );
  const parsed = schema.safeParse({
    ...Object.fromEntries(form),
    model: modelKey,
  });
  if (!parsed.success) {
    throw new ImageApiError(
      400,
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  }
  const data = parsed.data;
  const model = getImageModel(data.model)!;
  if (model.provider !== provider)
    throw new ImageApiError(
      400,
      "The selected model does not belong to this provider.",
    );
  const keySource =
    data.keySource ??
    (data.apiKey.startsWith("sk-or-") ? "openrouter" : provider);
  if (keySource !== provider && keySource !== "openrouter")
    throw new ImageApiError(
      400,
      "API key source does not match the selected provider.",
    );
  if ((keySource === "openrouter") !== data.apiKey.startsWith("sk-or-"))
    throw new ImageApiError(
      400,
      "Use an OpenRouter key for OpenRouter requests and a direct provider key otherwise.",
    );
  const quality = data.quality ?? model.defaultQuality;
  if (data.quality && !model.qualities.includes(data.quality))
    throw new ImageApiError(
      400,
      "This model does not support the selected quality.",
    );
  if (
    model.resolutions.length
      ? !model.resolutions.includes(data.resolution)
      : data.resolution !== "1K"
  )
    throw new ImageApiError(
      400,
      "This model does not support the selected resolution.",
    );

  const images = [...form.getAll("image[]"), ...form.getAll("image")];
  if (images.length !== 1)
    throw new ImageApiError(400, "Upload exactly one image to transform.");
  const image = validateImageFile(images[0]);
  const maskValue = form.get("mask");
  let mask: File | undefined;
  if (maskValue !== null) {
    if (provider !== "openai" || keySource === "openrouter")
      throw new ImageApiError(
        400,
        "Masks are only supported with a direct OpenAI key.",
      );
    mask = validateImageFile(maskValue);
    if (mask.type !== "image/png")
      throw new ImageApiError(400, "Masks must be PNG files.");
  }
  return {
    model: data.model,
    apiKey: data.apiKey,
    prompt: data.prompt,
    size: data.size,
    aspectRatio: ASPECT_RATIO_BY_SIZE[data.size],
    quality,
    resolution: data.resolution,
    keySource,
    image,
    mask,
  };
}

function validateImageFile(value: FormDataEntryValue | undefined): File {
  if (!(value instanceof File) || value.size === 0)
    throw new ImageApiError(400, "A non-empty image file is required.");
  if (!IMAGE_MIME_TYPES.some((type) => type === value.type))
    throw new ImageApiError(
      400,
      "Use a PNG, JPEG, or WebP image. Convert HEIC files before uploading.",
    );
  if (value.size > 4 * 1024 * 1024)
    throw new ImageApiError(400, "Images must be 4 MB or smaller.");
  return value;
}
