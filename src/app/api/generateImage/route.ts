import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ApiKeyService } from "@/services/apiKeyService";

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

    // Get user's API key
    const apiKey = await ApiKeyService.getApiKey(userId);

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API key not found. Please set your API key in the API Key settings page.",
        },
        { status: 400 }
      );
    }

    // Parse the multipart form data from the request
    const formData = await request.formData();

    // Extract params from the form data
    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "gpt-image-1";
    const n = Number(formData.get("n")) || 1;
    const quality = (formData.get("quality") as string) || "low";
    const size = (formData.get("size") as string) || "1024x1024";
    const user = formData.get("user") as string;

    // Get all image files
    const imageFiles = formData.getAll("image[]");

    // Get mask file if provided
    const maskFile = formData.get("mask") as File | null;

    // Create the new form data to send to OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append("prompt", prompt);
    openaiFormData.append("model", model);
    openaiFormData.append("n", n.toString());
    openaiFormData.append("quality", quality);
    openaiFormData.append("size", size);

    if (user) {
      openaiFormData.append("user", user);
    }

    // Append all image files
    imageFiles.forEach((imageFile, index) => {
      if (index === 0) {
        // First image goes under 'image' key
        openaiFormData.append("image", imageFile as File);
      } else {
        // Additional images go under 'image' key too
        openaiFormData.append("image", imageFile as File);
      }
    });

    // Append mask if provided
    if (maskFile) {
      openaiFormData.append("mask", maskFile);
    }

    // Call the OpenAI API
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    // Check if response is successful
    if (!response.ok) {
      let errorMessage = "Error connecting to OpenAI API";

      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message || "Error with image generation";
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          // Use default error message
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();

    // Update last used timestamp
    await ApiKeyService.updateLastUsed(userId);

    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generate-image API route:", error);

    return NextResponse.json(
      {
        error: "Something went wrong. Please check your API key and try again.",
      },
      { status: 500 }
    );
  }
}
