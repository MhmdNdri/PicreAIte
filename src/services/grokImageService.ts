import { IMAGE_MODELS } from "@/lib/image-models";
import { calculateImageCost } from "@/lib/image-pricing";
import type { ImageEditRequest } from "@/lib/image-request";
import { generatedImage, imageApiJson } from "./imageApi";

const XAI_API_BASE = "https://api.x.ai/v1";

export async function generateImageWithGrok(request: ImageEditRequest) {
  const data = Buffer.from(await request.image.arrayBuffer()).toString(
    "base64",
  );
  const json = await imageApiJson(
    `${XAI_API_BASE}/images/edits`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODELS[request.model].id,
        prompt: request.prompt,
        image: {
          url: `data:${request.image.type};base64,${data}`,
          type: "image_url",
        },
        aspect_ratio: request.aspectRatio,
        quality: request.quality,
        resolution: request.resolution.toLowerCase(),
        response_format: "b64_json",
      }),
    },
    "Grok",
  );
  const cost = calculateImageCost(request, json.usage);
  return {
    ...generatedImage(
      json.data?.[0]?.b64_json,
      "image/jpeg",
      cost.status === "reported" ? cost.amountUsd : undefined,
    ),
    cost,
  };
}

export async function validateGrokApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${XAI_API_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
