import { IMAGE_MODELS } from "@/lib/image-models";
import type { ImageEditRequest } from "@/lib/image-request";
import type { ImageGenerationResponse } from "@/lib/image-result";
import { generateImageWithOpenAI } from "./openaiImageService";
import { generateImageWithGemini } from "./geminiImageService";
import { generateImageWithGrok } from "./grokImageService";
import { generateImageWithOpenRouter } from "./openrouterImageService";

export async function generateImage(
  request: ImageEditRequest,
  appUrl?: string,
): Promise<ImageGenerationResponse> {
  const model = IMAGE_MODELS[request.model];
  const adapters = {
    openai: generateImageWithOpenAI,
    gemini: generateImageWithGemini,
    grok: generateImageWithGrok,
  };
  const result =
    request.keySource === "openrouter"
      ? await generateImageWithOpenRouter(request, appUrl)
      : await adapters[model.provider](request);
  return {
    data: [{ b64_json: result.imageBytes, mime_type: result.mimeType }],
    model: request.keySource === "openrouter" ? model.openRouterId : model.id,
    provider: request.keySource,
    cost: result.cost,
    settings: {
      size: request.size,
      resolution: request.resolution,
      quality: request.quality,
    },
    ...(result.costUsd === undefined ? {} : { costUsd: result.costUsd }),
  };
}
