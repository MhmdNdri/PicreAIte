import { IMAGE_MODELS } from "@/lib/image-models";
import { calculateImageCost } from "@/lib/image-pricing";
import type { ImageEditRequest } from "@/lib/image-request";
import { generatedImage, imageApiJson, ImageApiError } from "./imageApi";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1";

export async function generateImageWithGemini(request: ImageEditRequest) {
  const model = IMAGE_MODELS[request.model];
  const data = Buffer.from(await request.image.arrayBuffer()).toString(
    "base64",
  );
  // Documented v1 generateContent contract for the stable image models.
  const json = await imageApiJson(
    `${GEMINI_API_BASE}/models/${model.id}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": request.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: request.prompt },
              { inlineData: { data, mimeType: request.image.type } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          responseFormat: {
            image: {
              aspectRatio: request.aspectRatio,
              imageSize: request.resolution,
            },
          },
        },
      }),
    },
    "Gemini",
  );

  const candidate = json.candidates?.[0];
  if (
    json.promptFeedback?.blockReason ||
    ["SAFETY", "IMAGE_SAFETY", "PROHIBITED_CONTENT"].includes(
      candidate?.finishReason,
    )
  ) {
    throw new ImageApiError(
      400,
      "Gemini could not complete this edit because of its content filters. Try a different photo or style.",
    );
  }
  const parts: {
    thought?: boolean;
    inlineData?: { data?: string; mimeType?: string };
  }[] = candidate?.content?.parts ?? [];
  const outputs = parts.filter(
    (part) =>
      !part.thought &&
      part.inlineData?.data &&
      part.inlineData.mimeType?.startsWith("image/"),
  );
  const output = outputs[0];
  return {
    ...generatedImage(
      output?.inlineData?.data,
      output?.inlineData?.mimeType ?? "image/png",
    ),
    cost: calculateImageCost(request, json.usageMetadata, outputs.length),
  };
}

export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_BASE}/models`, {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
