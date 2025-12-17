import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { badRequest, handleRouteError, unauthorized } from "@/lib/api-errors";
import { generateOpenAiSchema } from "@/lib/validators";

export const maxDuration = 300; // Increase to 5 minutes (300 seconds)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      throw unauthorized("You need to be logged in to use this feature");
    }

    const formData = await request.formData();
    const raw = {
      apiKey: (formData.get("apiKey") as string | null) ?? "",
      prompt: (formData.get("prompt") as string | null) ?? "",
      model: (formData.get("model") as string | null) ?? undefined,
      n: (formData.get("n") as string | null) ?? undefined,
      quality: (formData.get("quality") as string | null) ?? undefined,
      size: (formData.get("size") as string | null) ?? undefined,
      user: (formData.get("user") as string | null) ?? undefined,
    };

    const parsed = generateOpenAiSchema.safeParse(raw);
    if (!parsed.success) {
      throw badRequest("Invalid request", parsed.error.flatten());
    }

    const apiKey = parsed.data.apiKey;
    const prompt = parsed.data.prompt;
    // Keep server fallback as gpt-image-1 to avoid implicitly changing defaults;
    // the client can explicitly request newer models (e.g. gpt-image-1.5).
    const model = parsed.data.model || "gpt-image-1";
    const n = parsed.data.n ?? 1;
    const quality = parsed.data.quality || "auto";
    const size = parsed.data.size || "1024x1024";
    const user = parsed.data.user;

    const imageFiles = formData.getAll("image[]");
    const maskFile = formData.get("mask") as File | null;

    if (imageFiles.length === 0) {
      throw badRequest("At least one image is required");
    }

    const openaiFormData = new FormData();
    openaiFormData.append("prompt", prompt);
    openaiFormData.append("model", model);
    openaiFormData.append("n", n.toString());

    // gpt-image-1 supports quality parameter: auto, low, medium, high
    openaiFormData.append("quality", quality);
    openaiFormData.append("size", size);

    if (user) {
      openaiFormData.append("user", user);
    }

    imageFiles.forEach((imageFile) => {
      openaiFormData.append("image", imageFile as File);
    });

    if (maskFile) {
      openaiFormData.append("mask", maskFile);
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 280000); // 280 seconds (20s buffer)

    try {
      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openaiFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error:
              "Request timed out. High-quality image generation can take several minutes. Please try with lower quality settings or try again later.",
          },
          { status: 408 }
        );
      }

      throw fetchError; // Re-throw other errors to be caught by outer try-catch
    }
  } catch (error) {
    return handleRouteError({
      error,
      fallbackMessage:
        "Something went wrong. Please check your API key and try again.",
      context: "api/generateImage POST",
    });
  }
}
