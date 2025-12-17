import { NextResponse } from "next/server";

/**
 * Use ApiError for expected failures (validation, unauthorized, etc).
 * For unexpected failures, throw normal errors and let `handleRouteError` map
 * them to a safe 500 response while logging the full details server-side.
 */
export class ApiError extends Error {
  status: number;
  /**
   * Optional JSON-serializable details for client-facing 4xx errors
   * (e.g. zod validation issues).
   */
  details?: unknown;

  constructor(
    status: number,
    message: string,
    options?: {
      cause?: unknown;
      details?: unknown;
    }
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(
      message,
      options?.cause ? ({ cause: options.cause } as any) : undefined
    );
    this.name = "ApiError";
    this.status = status;
    this.details = options?.details;
  }
}

export function asErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function handleRouteError(args: {
  error: unknown;
  /**
   * Safe, generic message to return for unexpected 5xx failures.
   */
  fallbackMessage: string;
  /**
   * Short string for server logs (e.g. "api/prompts POST").
   */
  context?: string;
}): NextResponse {
  const { error, fallbackMessage, context } = args;

  if (error instanceof ApiError) {
    // Expected / user-caused errors: return message + details without noisy logging.
    const body =
      error.details === undefined
        ? { error: error.message }
        : { error: error.message, details: error.details };
    return NextResponse.json(body, { status: error.status });
  }

  // Unexpected errors: log full detail server-side; return safe generic message.
  const prefix = context ? `[${context}]` : "[api]";
  console.error(`${prefix}`, error);

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export function badRequest(
  message: string,
  details?: unknown,
  cause?: unknown
) {
  return new ApiError(400, message, { details, cause });
}

export function unauthorized(
  message: string = "Unauthorized",
  cause?: unknown
) {
  return new ApiError(401, message, { cause });
}

export function notFound(message: string = "Not found", cause?: unknown) {
  return new ApiError(404, message, { cause });
}

