import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Constants
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const OPENAI_KEY_PREFIX = "sk-";
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  KEY_REQUIRED: "API key is required",
  INVALID_FORMAT: `Invalid API key format. OpenAI API keys should start with '${OPENAI_KEY_PREFIX}'`,
  DEFAULT_VALIDATION_ERROR: "Invalid API key",
};

/**
 * Validates an OpenAI API key by making a test request to the models endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }

    // Get API key from request body
    const { apiKey } = await request.json();
    if (!apiKey) {
      return createErrorResponse(ERROR_MESSAGES.KEY_REQUIRED, 400);
    }

    // Format check
    if (!apiKey.startsWith(OPENAI_KEY_PREFIX)) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_FORMAT, 400);
    }

    // Validate key with OpenAI API
    const isValid = await validateWithOpenAI(apiKey);
    if (!isValid.valid) {
      return createErrorResponse(
        isValid.errorMessage || ERROR_MESSAGES.DEFAULT_VALIDATION_ERROR,
        400
      );
    }

    // Key is valid
    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Error validating OpenAI API key:", error.message);
    return createErrorResponse(
      `API key validation failed: ${error.message}`,
      500
    );
  }
}

/**
 * Helper to create consistent error responses
 */
function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

/**
 * Makes a request to OpenAI API to validate the key
 */
async function validateWithOpenAI(
  apiKey: string
): Promise<{ valid: boolean; errorMessage?: string }> {
  try {
    const response = await fetch(OPENAI_MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = ERROR_MESSAGES.DEFAULT_VALIDATION_ERROR;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Use default error message
      }
      return { valid: false, errorMessage };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, errorMessage: error.message };
  }
}
