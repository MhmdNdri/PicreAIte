import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { generateImageWithGemini } from "@/services/geminiImageService";

export const maxDuration = 60; // Set max duration to 60 seconds (1 minute)
export const runtime = "nodejs"; // Specify Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: "You need to be logged in to use this feature",
        },
        { status: 401 }
      );
    }

    // Parse the form data from the request
    const formData = await request.formData();

    // Extract params from the form data
    const prompt = formData.get("prompt") as string;
    const apiKey = formData.get("apiKey") as string;
    const aspectRatio = (formData.get("aspectRatio") as string) || "1:1";

    // Get image file for editing
    const imageFile = formData.get("image") as File | null;

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields (prompt, apiKey)" },
        { status: 400 }
      );
    }

    let geminiOptions: any = {
      aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      numberOfImages: 1,
    };

    // If image is provided, add it for editing
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const base64Image = imageBuffer.toString("base64");

      geminiOptions.inputImage = {
        imageBytes: base64Image,
        mimeType: imageFile.type,
      };
    }

    // Call Gemini API
    const result = await generateImageWithGemini(apiKey, prompt, geminiOptions);

    if (!result.imageBytes) {
      throw new Error("No image data received from Gemini");
    }

    // Return the response in the same format as OpenAI
    return NextResponse.json({
      data: [
        {
          b64_json: result.imageBytes,
        },
      ],
    });
  } catch (error) {
    console.error("Error in generateImageGemini API route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific Gemini errors
    if (errorMessage.includes("not available in your country")) {
      return NextResponse.json(
        {
          error:
            "Gemini image generation is not available in your country. Please try using OpenAI instead.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
