import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import type { ImageProvider } from "./image-models";
import { parseImageRequest } from "./image-request";
import { generateImage } from "@/services/imageGenerationService";
import { ImageApiError } from "@/services/imageApi";
import { streamImageResponse } from "./image-response";

export function imageRoute(provider: ImageProvider) {
  return async function POST(request: NextRequest) {
    try {
      const { userId } = getAuth(request);
      if (!userId)
        return NextResponse.json(
          { error: "You need to be logged in to use this feature" },
          { status: 401 },
        );
      const form = await request.formData().catch(() => {
        throw new ImageApiError(400, "Invalid image upload request.");
      });
      const result = await generateImage(
        parseImageRequest(form, provider),
        request.nextUrl.origin,
      );
      return streamImageResponse(result);
    } catch (error) {
      if (error instanceof ImageApiError) {
        return NextResponse.json(
          { error: error.message },
          {
            status:
              error.status >= 400 && error.status <= 599 ? error.status : 502,
          },
        );
      }
      if (
        error instanceof Error &&
        ["AbortError", "TimeoutError"].includes(error.name)
      ) {
        return NextResponse.json(
          {
            error:
              "Image generation timed out. Try a lower quality or resolution.",
          },
          { status: 504 },
        );
      }
      // Do not log request bodies, uploaded photos, or user API keys.
      return NextResponse.json(
        {
          error:
            "Image generation failed. Check your connection and try again.",
        },
        { status: 502 },
      );
    }
  };
}
