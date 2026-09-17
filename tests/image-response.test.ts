import { test } from "node:test";
import assert from "node:assert/strict";
import { streamImageResponse } from "../src/lib/image-response";
import type { ImageGenerationResponse } from "../src/lib/image-result";

function result(imageBytes = "aGVsbG8="): ImageGenerationResponse {
  return {
    data: [{ b64_json: imageBytes, mime_type: "image/png" }],
    model: "gemini-3-pro-image",
    provider: "gemini",
    settings: { size: "1024x1024", resolution: "4K", quality: "high" },
    cost: {
      status: "unavailable",
      lineItems: [],
      note: "No usage metadata was returned.",
      sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
      checkedAt: "2026-09-17",
    },
  };
}

test("completed image JSON larger than 4.5 MB survives response.json unchanged", async () => {
  const payload = result("a".repeat(5 * 1024 * 1024));
  const response = streamImageResponse(payload);

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.has("content-length"), false);
  assert.deepEqual(await response.json(), payload);
});

test("delivery uses bounded byte chunks and preserves multibyte Unicode", async () => {
  const payload = result();
  payload.cost.note = "a".repeat(65_001) + "🎨 日本語 فارسی café".repeat(8_000);
  const expected = new TextEncoder().encode(JSON.stringify(payload));
  const reader = streamImageResponse(payload).body!.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let decoded = "";
  let bytesRead = 0;
  let chunks = 0;
  let splitMultibyteSequence = false;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    assert.ok(value.byteLength > 0 && value.byteLength <= 64 * 1024);
    // At least one chunk must start inside a UTF-8 character; decoding each
    // chunk independently would corrupt this fixture.
    if (value[0]! >= 0x80 && value[0]! <= 0xbf) splitMultibyteSequence = true;
    decoded += decoder.decode(value, { stream: true });
    bytesRead += value.byteLength;
    chunks++;
  }
  decoded += decoder.decode();

  assert.ok(chunks > 1);
  assert.equal(splitMultibyteSequence, true);
  assert.equal(bytesRead, expected.byteLength);
  assert.deepEqual(JSON.parse(decoded), payload);
});

test("serialization errors occur before a successful response is returned", () => {
  const payload = result();
  Object.assign(payload.cost, { circular: payload });
  assert.throws(() => streamImageResponse(payload), TypeError);
});
