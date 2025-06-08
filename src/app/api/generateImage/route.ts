import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ApiKeyService } from "@/services/apiKeyService";

export const maxDuration = 60;
export const runtime = "nodejs";

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

    const formData = await request.formData();

    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "gpt-image-1";
    const n = Number(formData.get("n")) || 1;
    const quality = (formData.get("quality") as string) || "low";
    const size = (formData.get("size") as string) || "1024x1024";
    const user = formData.get("user") as string;

    const imageFiles = formData.getAll("image[]");

    const maskFile = formData.get("mask") as File | null;

    const openaiFormData = new FormData();
    openaiFormData.append("prompt", prompt);
    openaiFormData.append("model", model);
    openaiFormData.append("n", n.toString());
    openaiFormData.append("quality", quality);
    openaiFormData.append("size", size);

    if (user) {
      openaiFormData.append("user", user);
    }

    imageFiles.forEach((imageFile, index) => {
      if (index === 0) {
        openaiFormData.append("image", imageFile as File);
      } else {
        openaiFormData.append("image", imageFile as File);
      }
    });

    if (maskFile) {
      openaiFormData.append("mask", maskFile);
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      let errorMessage = "Error connecting to OpenAI API";

      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message || "Error with image generation";
      } catch (parseError) {
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

    const data = await response.json();

    await ApiKeyService.updateLastUsed(userId);

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
