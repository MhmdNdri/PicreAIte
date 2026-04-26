import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  generateImageWithGemini,
  type GeminiImageOptions,
} from "@/services/geminiImageService";
import { generateImageWithOpenRouter } from "@/services/openrouterImageService";
import { ApiError, badRequest, unauthorized } from "@/lib/api-errors";
import { generateGeminiSchema } from "@/lib/validators";

export const maxDuration = 60; // Set max duration to 60 seconds (1 minute)
export const runtime = "nodejs"; // Specify Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      throw unauthorized("You need to be logged in to use this feature");
    }

    // Parse the form data from the request
    const formData = await request.formData();

    // Extract params from the form data
    const raw = {
      prompt: (formData.get("prompt") as string | null) ?? "",
      apiKey: (formData.get("apiKey") as string | null) ?? "",
      model: (formData.get("model") as string | null) ?? undefined,
      aspectRatio: (formData.get("aspectRatio") as string | null) ?? undefined,
    };

    // Get image file for editing (only used by Nano Banana models)
    const imageFile = formData.get("image") as File | null;

    const parsed = generateGeminiSchema.safeParse(raw);
    if (!parsed.success) {
      throw badRequest("Invalid request", parsed.error.flatten());
    }

    if (!imageFile) {
      throw badRequest("Image is required for Gemini image editing");
    }

    if (parsed.data.apiKey.startsWith("sk-or-")) {
      const sizeFromAspectRatio =
        parsed.data.aspectRatio === "9:16" || parsed.data.aspectRatio === "3:4"
          ? "1024x1536"
          : parsed.data.aspectRatio === "16:9" ||
            parsed.data.aspectRatio === "4:3"
          ? "1536x1024"
          : "1024x1024";

      const result = await generateImageWithOpenRouter(
        parsed.data.apiKey,
        parsed.data.prompt,
        {
          model: "openrouter-gpt-image-1",
          size: sizeFromAspectRatio,
          quality: "high",
          inputImage: imageFile,
          appUrl: request.nextUrl.origin,
        }
      );

      return NextResponse.json({
        data: [{ b64_json: result.imageBytes }],
      });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = imageBuffer.toString("base64");

    const geminiOptions: GeminiImageOptions = {
      model: parsed.data.model,
      aspectRatio:
        (parsed.data.aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9") ||
        "1:1",
      inputImage: {
        imageBytes: base64Image,
        mimeType: imageFile.type || "image/png",
      },
    };

    // Call Gemini API
    const result = await generateImageWithGemini(
      parsed.data.apiKey,
      parsed.data.prompt,
      geminiOptions
    );

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
    // ApiError (badRequest, unauthorized, etc.) → return proper status
    if (error instanceof ApiError) {
      const body =
        error.details === undefined
          ? { error: error.message }
          : { error: error.message, details: error.details };
      return NextResponse.json(body, { status: error.status });
    }

    const msg = error instanceof Error ? error.message : String(error);
    // Known user-fixable errors → 4xx with message
    if (
      msg.includes("not available in your country") ||
      msg.includes("Invalid Gemini API key") ||
      msg.includes("blocked by Gemini safety")
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("quota exceeded") || msg.includes("Quota exceeded")) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    if (msg.includes("Invalid OpenRouter API key")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("OpenRouter quota exceeded")) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    if (msg.startsWith("OpenRouter image generation failed")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    // Pass through our Gemini errors (they include the underlying cause)
    if (msg.startsWith("Gemini image generation failed:")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    console.error("[api/generateImageGemini POST]", error);
    return NextResponse.json(
      { error: msg || "Gemini image generation failed" },
      { status: 500 }
    );
  }
}
