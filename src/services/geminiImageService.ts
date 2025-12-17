import {
  GoogleGenAI,
  SafetyFilterLevel,
  PersonGeneration,
} from "@google/genai";

export interface GeminiImageOptions {
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  numberOfImages?: number;
  safetyFilterLevel?: SafetyFilterLevel;
  personGeneration?: PersonGeneration;
  inputImage?: {
    imageBytes: string;
    mimeType: string;
  };
}

export async function generateImageWithGemini(
  apiKey: string,
  prompt: string,
  options: GeminiImageOptions = {}
) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    if (options.inputImage) {
      // IMPORTANT: Gemini doesn't actually support image editing like OpenAI's gpt-image-1
      // Gemini is designed for image understanding, not editing
      // We'll inform the user and suggest using OpenAI instead
      throw new Error(
        "Image editing is not supported with Gemini. Gemini is designed for image understanding and analysis, not editing. Please use OpenAI (gpt-image-1.5) for image editing capabilities."
      );
    } else {
      // Use Imagen 3 for text-to-image generation (this works well)
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: prompt,
        config: {
          numberOfImages: options.numberOfImages || 1,
          aspectRatio: options.aspectRatio || "1:1",
          safetyFilterLevel:
            options.safetyFilterLevel || SafetyFilterLevel.BLOCK_LOW_AND_ABOVE,
          personGeneration:
            options.personGeneration || PersonGeneration.ALLOW_ADULT,
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No images generated");
      }

      const generatedImage = response.generatedImages[0];

      if (!generatedImage?.image?.imageBytes) {
        throw new Error("Generated image data is missing");
      }

      return {
        imageBytes: generatedImage.image.imageBytes,
        mimeType: "image/png",
      };
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for geographic restrictions
    if (errorMessage.includes("not available in your country")) {
      throw new Error(
        "Gemini image generation is not available in your country. Please try using OpenAI instead."
      );
    }

    // Check for safety setting issues
    if (
      errorMessage.includes("safetySetting") ||
      errorMessage.includes("safety")
    ) {
      throw new Error(
        "Content was blocked by Gemini safety filters. Please try with different content or prompt."
      );
    }

    // Check for authentication issues
    if (
      errorMessage.includes("authentication") ||
      errorMessage.includes("API key")
    ) {
      throw new Error(
        "Invalid Gemini API key. Please check your API key and try again."
      );
    }

    // Pass through our custom image editing error message
    if (errorMessage.includes("Image editing is not supported with Gemini")) {
      throw error;
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
