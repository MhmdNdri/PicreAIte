import {
  OPENROUTER_IMAGE_MODELS,
  type OpenRouterImageModelKey,
} from "@/lib/openrouter-models";

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterImageOptions {
  model: OpenRouterImageModelKey;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "low" | "medium" | "high";
  inputImage: File;
  appUrl?: string;
}

export interface OpenRouterImageResult {
  imageBytes: string;
  mimeType: string;
}

export async function generateImageWithOpenRouter(
  apiKey: string,
  prompt: string,
  options: OpenRouterImageOptions
): Promise<OpenRouterImageResult> {
  const primaryModel = OPENROUTER_IMAGE_MODELS[options.model];
  if (!primaryModel) {
    throw new Error(`Unknown OpenRouter model: ${options.model}`);
  }

  // Use a built-in fallback so one OpenRouter key works reliably
  // even if one model is temporarily unavailable/unroutable.
  // gpt-image-1-mini can return 405 on /images/edits depending on routing/tier.
  const modelCandidates: OpenRouterImageModelKey[] =
    options.model === "openrouter-gpt-image-1-mini"
      ? ["openrouter-gpt-image-1-mini", "openrouter-gpt-image-1"]
      : options.model === "openrouter-gpt-image-2"
        ? ["openrouter-gpt-image-2", "openrouter-gpt-image-1"]
        : ["openrouter-gpt-image-1"];
  let lastError: string | null = null;

  for (const modelKey of modelCandidates) {
    const modelConfig = OPENROUTER_IMAGE_MODELS[modelKey];
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("model", modelConfig.id);
    formData.append("n", "1");
    formData.append("size", options.size || "1024x1024");
    formData.append("quality", options.quality || "high");
    formData.append("image", options.inputImage);

    const response = await fetch(`${OPENROUTER_API_BASE}/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(options.appUrl ? { "HTTP-Referer": options.appUrl } : {}),
        "X-Title": "PicreAIte",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const defaultMessage = "OpenRouter image generation failed";
      let errorMessage = defaultMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error?.message ||
          errorJson.message ||
          errorJson.error ||
          errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }

      if (response.status === 401) {
        throw new Error("Invalid OpenRouter API key");
      }
      if (response.status === 429) {
        throw new Error("OpenRouter quota exceeded. Please check your account.");
      }

      lastError =
        errorMessage === defaultMessage
          ? `HTTP ${response.status} on model ${modelConfig.id}`
          : `${errorMessage} (model: ${modelConfig.id})`;
      continue;
    }

    const json = await response.json();
    const b64Direct: string | undefined = json?.data?.[0]?.b64_json;
    const imageUrl: string | undefined = json?.data?.[0]?.url;

    if (b64Direct) {
      return { imageBytes: b64Direct, mimeType: "image/png" };
    }

    if (!imageUrl) {
      lastError = `No image data in response (model: ${modelConfig.id})`;
      continue;
    }

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      lastError = `Could not download result image (model: ${modelConfig.id})`;
      continue;
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = imgResponse.headers.get("content-type") || "image/png";
    return { imageBytes: base64, mimeType: contentType };
  }

  throw new Error(
    `OpenRouter image generation failed: ${lastError || "all model attempts failed"}`
  );
}

export async function validateOpenRouterApiKey(
  apiKey: string,
  appUrl?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${OPENROUTER_API_BASE}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(appUrl ? { "HTTP-Referer": appUrl } : {}),
        "X-Title": "PicreAIte",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

