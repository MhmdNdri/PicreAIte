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

    // Use Gemini 2.0 Flash for image editing, Imagen 3 for text-to-image
    if (options.inputImage) {
      // Use Gemini 2.0 Flash for image editing with input image
      const contents = [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: options.inputImage.mimeType,
            data: options.inputImage.imageBytes,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      // Find the image in the response
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates received from Gemini");
      }

      const candidate = response.candidates[0];
      if (!candidate?.content?.parts) {
        throw new Error("No content parts received from Gemini");
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return {
            imageBytes: part.inlineData.data,
            mimeType: "image/png",
          };
        }
      }

      throw new Error("No image data received from Gemini");
    } else {
      // Use Imagen 3 for text-to-image generation
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
    if (errorMessage.includes("safetySetting")) {
      throw new Error(
        "Gemini safety settings error. Please try with different content."
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
