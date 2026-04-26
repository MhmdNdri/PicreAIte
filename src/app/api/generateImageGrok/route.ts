import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  generateImageWithGrok,
  type GrokImageOptions,
} from "@/services/grokImageService";
import { generateImageWithOpenRouter } from "@/services/openrouterImageService";
import { ApiError, badRequest, unauthorized } from "@/lib/api-errors";
import { generateGrokSchema } from "@/lib/validators";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      throw unauthorized("You need to be logged in to use this feature");
    }

    const formData = await request.formData();

    const raw = {
      prompt: (formData.get("prompt") as string | null) ?? "",
      apiKey: (formData.get("apiKey") as string | null) ?? "",
      model: (formData.get("model") as string | null) ?? undefined,
      aspectRatio: (formData.get("aspectRatio") as string | null) ?? undefined,
    };

    const imageFile = formData.get("image") as File | null;

    const parsed = generateGrokSchema.safeParse(raw);
    if (!parsed.success) {
      throw badRequest("Invalid request", parsed.error.flatten());
    }

    if (!imageFile) {
      throw badRequest("Image is required for Grok image editing");
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

    const grokOptions: GrokImageOptions = {
      model: parsed.data.model,
      aspectRatio:
        (parsed.data.aspectRatio as
          | "1:1"
          | "16:9"
          | "9:16"
          | "4:3"
          | "3:4"
          | undefined) || "1:1",
      inputImage: {
        imageBytes: base64Image,
        mimeType: imageFile.type || "image/jpeg",
      },
    };

    const result = await generateImageWithGrok(
      parsed.data.apiKey,
      parsed.data.prompt,
      grokOptions
    );

    if (!result.imageBytes) {
      throw new Error("No image data received from Grok");
    }

    return NextResponse.json({
      data: [
        {
          b64_json: result.imageBytes,
        },
      ],
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const body =
        error.details === undefined
          ? { error: error.message }
          : { error: error.message, details: error.details };
      return NextResponse.json(body, { status: error.status });
    }

    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("Invalid Grok API key")) {
      return NextResponse.json({ error: msg }, { status: 401 });
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
    if (msg.startsWith("Grok image generation failed:")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    console.error("[api/generateImageGrok POST]", error);
    return NextResponse.json(
      { error: msg || "Grok image generation failed" },
      { status: 500 }
    );
  }
}
