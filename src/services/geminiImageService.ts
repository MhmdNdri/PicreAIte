import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_IMAGE_MODELS,
  type GeminiImageModelKey,
} from "@/lib/gemini-models";

export interface GeminiImageOptions {
  model: GeminiImageModelKey;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  inputImage: {
    imageBytes: string;
    mimeType: string;
  };
}

export async function generateImageWithGemini(
  apiKey: string,
  prompt: string,
  options: GeminiImageOptions
) {
  const modelConfig = GEMINI_IMAGE_MODELS[options.model];
  if (!modelConfig) {
    throw new Error(`Unknown Gemini model: ${options.model}`);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: prompt },
      {
        inlineData: {
          mimeType: options.inputImage.mimeType,
          data: options.inputImage.imageBytes,
        },
      },
    ];

    // Build config - imageConfig for aspect ratio (API supports it; SDK types may not include it yet)
    const config: Record<string, unknown> = {
      responseModalities: ["TEXT", "IMAGE"],
    };
    if (options.aspectRatio) {
      config.imageConfig = { aspectRatio: options.aspectRatio };
    }

    const response = await ai.models.generateContent({
      model: modelConfig.id,
      contents,
      config: config as object,
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return {
          imageBytes: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }

    throw new Error("No image data in response");
  } catch (error) {
    console.error("Error generating image with Gemini:", error);

    // Extract full error message (API errors may nest details)
    let errorMessage = error instanceof Error ? error.message : String(error);
    const err = error as Error & {
      cause?: { message?: string };
      body?: unknown;
      status?: number;
    };
    if (err.cause?.message) errorMessage += ` | ${err.cause.message}`;
    if (err.body && typeof err.body === "object") {
      const bodyMsg = (err.body as { error?: { message?: string }; message?: string }).error?.message
        ?? (err.body as { message?: string }).message;
      if (bodyMsg) errorMessage += ` | ${bodyMsg}`;
    }

    if (errorMessage.includes("not available in your country")) {
      throw new Error(
        "Gemini image generation is not available in your country. Please try using OpenAI instead."
      );
    }
    if (
      errorMessage.includes("safetySetting") ||
      errorMessage.includes("safety")
    ) {
      throw new Error(
        "Content was blocked by Gemini safety filters. Please try with different content or prompt."
      );
    }
    if (
      errorMessage.includes("authentication") ||
      errorMessage.includes("API key") ||
      errorMessage.includes("API_KEY_INVALID") ||
      errorMessage.includes("403") ||
      errorMessage.includes("401")
    ) {
      throw new Error(
        "Invalid Gemini API key. Please check your API key and try again."
      );
    }
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("Quota exceeded")
    ) {
      throw new Error(
        "Gemini quota exceeded. The free tier has limited requests. Add billing at https://aistudio.google.com or try again later."
      );
    }

    throw new Error(`Gemini image generation failed: ${errorMessage}`);
  }
}

export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.list();
    return true;
  } catch (error) {
    console.error("Gemini API key validation failed:", error);
    return false;
  }
}
