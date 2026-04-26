import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { validateOpenRouterApiKey } from "@/services/openrouterImageService";

const OPENROUTER_KEY_PREFIX = "sk-or-";
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  KEY_REQUIRED: "API key is required",
  INVALID_FORMAT: `Invalid API key format. OpenRouter API keys should start with '${OPENROUTER_KEY_PREFIX}'`,
  DEFAULT_VALIDATION_ERROR: "Invalid API key",
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }

    const { apiKey } = await request.json();
    if (!apiKey) {
      return createErrorResponse(ERROR_MESSAGES.KEY_REQUIRED, 400);
    }

    if (!apiKey.startsWith(OPENROUTER_KEY_PREFIX)) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_FORMAT, 400);
    }

    const isValid = await validateOpenRouterApiKey(apiKey, request.nextUrl.origin);
    if (!isValid) {
      return createErrorResponse(ERROR_MESSAGES.DEFAULT_VALIDATION_ERROR, 400);
    }

    return NextResponse.json({ valid: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error validating OpenRouter API key:", message);
    return createErrorResponse(`API key validation failed: ${message}`, 500);
  }
}

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

