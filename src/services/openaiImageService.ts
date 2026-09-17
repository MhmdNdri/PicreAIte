import { IMAGE_MODELS } from "@/lib/image-models";
import { calculateImageCost } from "@/lib/image-pricing";
import type { ImageEditRequest } from "@/lib/image-request";
import { generatedImage, imageApiJson } from "./imageApi";

export async function generateImageWithOpenAI(request: ImageEditRequest) {
  const body = new FormData();
  body.append("model", IMAGE_MODELS[request.model].id);
  body.append("prompt", request.prompt);
  body.append("image[]", request.image);
  body.append("n", "1");
  body.append("size", request.size);
  body.append("quality", request.quality);
  body.append("output_format", "png");
  if (request.mask) body.append("mask", request.mask);
  const json = await imageApiJson(
    "https://api.openai.com/v1/images/edits",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${request.apiKey}` },
      body,
    },
    "OpenAI",
  );
  return {
    ...generatedImage(json.data?.[0]?.b64_json, "image/png"),
    cost: calculateImageCost(request, json.usage),
  };
}
