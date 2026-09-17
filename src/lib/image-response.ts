import type { ImageGenerationResponse } from "./image-result";

const CHUNK_BYTES = 64 * 1024;

/**
 * Stream only a completed, validated result. Large base64 images can exceed a
 * host's buffered response limit; the client can still use response.json().
 * This streams delivery, not the provider's generation or partial images.
 */
export function streamImageResponse(result: ImageGenerationResponse): Response {
  // Serialize before returning a response so failures retain normal HTTP error
  // handling. Encode once before slicing to preserve Unicode across chunks.
  const bytes = new TextEncoder().encode(JSON.stringify(result));
  let offset = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const end = Math.min(offset + CHUNK_BYTES, bytes.byteLength);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
      if (offset === bytes.byteLength) controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
