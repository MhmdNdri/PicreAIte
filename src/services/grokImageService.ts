import { GROK_IMAGE_MODELS, type GrokImageModelKey } from "@/lib/grok-models";

const XAI_API_BASE = "https://api.x.ai/v1";

export interface GrokImageOptions {
  model: GrokImageModelKey;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  inputImage: {
    imageBytes: string; // base64
    mimeType: string;
  };
}

export interface GrokImageResult {
  imageBytes: string; // base64
  mimeType: string;
}

export async function generateImageWithGrok(
  apiKey: string,
  prompt: string,
  options: GrokImageOptions
): Promise<GrokImageResult> {
  const modelId = GROK_IMAGE_MODELS[options.model].id;
  const { imageBytes, mimeType } = options.inputImage;
  const dataUri = `data:${mimeType};base64,${imageBytes}`;

  const body: Record<string, unknown> = {
    model: modelId,
    prompt,
    image: {
      url: dataUri,
      type: "image_url",
    },
  };

  if (options.aspectRatio) {
    body.aspect_ratio = options.aspectRatio;
  }

  const response = await fetch(`${XAI_API_BASE}/images/edits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorJson.error || errorText;
    } catch {
      errorMessage = errorText;
    }

    if (response.status === 401) {
      throw new Error("Invalid Grok API key");
    }
    if (response.status === 429) {
      throw new Error("Grok quota exceeded. Please check your xAI account.");
    }

    throw new Error(`Grok image generation failed: ${errorMessage}`);
  }

  const json = await response.json();

  // xAI returns URLs by default — download and convert to base64
  const imageUrl: string | undefined = json?.data?.[0]?.url;
  const b64Direct: string | undefined = json?.data?.[0]?.b64_json;

  if (b64Direct) {
    return { imageBytes: b64Direct, mimeType: "image/jpeg" };
  }

  if (!imageUrl) {
    throw new Error("Grok image generation failed: no image data in response");
  }

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    throw new Error("Grok image generation failed: could not download result image");
  }

  const arrayBuffer = await imgResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = imgResponse.headers.get("content-type") || "image/jpeg";

  return { imageBytes: base64, mimeType: contentType };
}

export async function validateGrokApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${XAI_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
