import { getImageModel } from "@/lib/image-models";
import { calculateImageCost } from "@/lib/image-pricing";
import type { ImageEditRequest } from "@/lib/image-request";
import { generatedImage, imageApiJson } from "./imageApi";

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export async function generateImageWithOpenRouter(
  request: ImageEditRequest,
  appUrl?: string,
) {
  const model = getImageModel(request.model)!;
  const imageBytes = Buffer.from(await request.image.arrayBuffer()).toString(
    "base64",
  );
  // Use the dedicated Images API and never substitute another model on failure.
  const json = await imageApiJson(
    `${OPENROUTER_API_BASE}/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
        ...(appUrl ? { "HTTP-Referer": appUrl } : {}),
        "X-Title": "PicreAIte",
      },
      body: JSON.stringify({
        model: model.openRouterId,
        prompt: request.prompt,
        n: 1,
        input_references: [
          {
            type: "image_url",
            image_url: {
              url: `data:${request.image.type};base64,${imageBytes}`,
            },
          },
        ],
        ...(model.provider === "openai"
          ? { size: request.size }
          : {
              aspect_ratio: request.aspectRatio,
              resolution: request.resolution,
            }),
        ...(model.qualities.length ? { quality: request.quality } : {}),
      }),
    },
    "OpenRouter",
  );
  return {
    ...generatedImage(
      json.data?.[0]?.b64_json,
      json.data?.[0]?.media_type ?? "image/png",
      json.usage?.cost,
    ),
    cost: calculateImageCost(request, json.usage),
  };
}

export async function validateOpenRouterApiKey(
  apiKey: string,
  appUrl?: string,
): Promise<boolean> {
  try {
    // /models is public and cannot validate a secret. /key is authenticated.
    const response = await fetch(`${OPENROUTER_API_BASE}/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(appUrl ? { "HTTP-Referer": appUrl } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
