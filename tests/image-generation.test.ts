import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { createImageForm } from "../src/lib/image-form";
import { parseImageRequest } from "../src/lib/image-request";
import {
  IMAGE_MODELS,
  resolveKeySource,
  getImageModel,
  type ImageModelKey,
  type ImageProvider,
} from "../src/lib/image-models";
import { generateImage } from "../src/services/imageGenerationService";
import { generatedImage, ImageApiError } from "../src/services/imageApi";
import { validateOpenRouterApiKey } from "../src/services/openrouterImageService";
import { imageExtension } from "../src/lib/image-result";

// Tiny image fixtures; no provider calls, real credentials, or database needed.
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=";
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]).toString(
  "base64",
);
const image = () =>
  new File([Buffer.from(png, "base64")], "photo.png", { type: "image/png" });

// Literal fixtures represent provider contracts, independently of the registry.
const cases: [ImageModelKey, ImageProvider, string, string][] = [
  [
    "openai",
    "openai",
    "gpt-image-2.5-sunburst",
    "openai/gpt-image-2.5-sunburst",
  ],
  [
    "openai-fast",
    "openai",
    "gpt-image-2.5-flare",
    "openai/gpt-image-2.5-flare",
  ],
  ["openai-mini", "openai", "gpt-image-1-mini", "openai/gpt-image-1-mini"],
  [
    "gemini-nano-banana-2",
    "gemini",
    "gemini-3.1-flash-image",
    "google/gemini-3.1-flash-image",
  ],
  [
    "gemini-nano-banana",
    "gemini",
    "gemini-3.1-flash-lite-image",
    "google/gemini-3.1-flash-lite-image",
  ],
  [
    "gemini-nano-banana-pro",
    "gemini",
    "gemini-3-pro-image",
    "google/gemini-3-pro-image",
  ],
  [
    "grok-imagine",
    "grok",
    "grok-imagine-image-2.0",
    "x-ai/grok-imagine-image-2.0",
  ],
];

function form(model: ImageModelKey, viaOpenRouter = false) {
  return createImageForm({
    model,
    keySource: viaOpenRouter ? "openrouter" : IMAGE_MODELS[model].provider,
    apiKey: viaOpenRouter ? "sk-or-test-placeholder" : "test-placeholder",
    prompt: "Make this photo a watercolor painting",
    image: image(),
    size: "1536x1024",
    quality: "high",
    resolution: "1K",
  });
}

afterEach(() => mock.restoreAll());

for (const [key, provider, directId, routerId] of cases) {
  test(`${key}: direct API keeps model identity and the 3:2 editing contract`, async () => {
    const fetch = mock.method(
      globalThis,
      "fetch",
      async (url: string | URL | Request, init?: RequestInit) => {
        assert.ok(init?.signal, "Requests need a bounded timeout");
        if (provider === "openai") {
          assert.equal(url, "https://api.openai.com/v1/images/edits");
          const body = init!.body as FormData;
          assert.equal(body.get("model"), directId);
          assert.equal(body.get("size"), "1536x1024");
          assert.equal(body.get("output_format"), "png");
          assert.equal(body.getAll("image[]").length, 1);
          assert.ok(body.get("image[]") instanceof File);
          return Response.json({ data: [{ b64_json: png }] });
        }
        const body = JSON.parse(init!.body as string);
        if (provider === "gemini") {
          assert.equal(
            url,
            `https://generativelanguage.googleapis.com/v1/models/${directId}:generateContent`,
          );
          assert.equal(
            new Headers(init?.headers).get("x-goog-api-key"),
            "test-placeholder",
          );
          assert.equal(body.contents[0].parts[1].inlineData.data, png);
          assert.deepEqual(body.generationConfig.responseFormat, {
            image: { aspectRatio: "3:2", imageSize: "1K" },
          });
          return Response.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      thought: true,
                      inlineData: { data: jpeg, mimeType: "image/jpeg" },
                    },
                    { inlineData: { data: png, mimeType: "image/png" } },
                  ],
                },
              },
            ],
          });
        }
        assert.equal(url, "https://api.x.ai/v1/images/edits");
        assert.equal(body.model, directId);
        assert.equal(body.image.url, `data:image/png;base64,${png}`);
        assert.equal(body.aspect_ratio, "3:2");
        assert.equal(body.resolution, "1k");
        assert.equal(body.quality, "medium");
        assert.equal(body.response_format, "b64_json");
        return Response.json({ data: [{ b64_json: jpeg }] });
      },
    );
    const result = await generateImage(parseImageRequest(form(key), provider));
    assert.equal(fetch.mock.callCount(), 1);
    assert.equal(result.model, directId);
    assert.equal(result.provider, provider);
    assert.equal(
      result.data[0]?.mime_type,
      provider === "grok" ? "image/jpeg" : "image/png",
    );
    assert.equal(
      result.data[0]?.b64_json,
      provider === "grok" ? jpeg : png,
      "Never return Gemini thought images",
    );
    assert.equal(
      result.costUsd,
      undefined,
      "Never invent a direct-provider charge",
    );
  });

  test(`${key}: OpenRouter executes the selected model and preserves reported cost`, async () => {
    mock.method(
      globalThis,
      "fetch",
      async (url: string | URL | Request, init?: RequestInit) => {
        assert.equal(url, "https://openrouter.ai/api/v1/images");
        assert.equal(
          new Headers(init?.headers).get("Authorization"),
          "Bearer sk-or-test-placeholder",
        );
        const body = JSON.parse(init!.body as string);
        assert.equal(body.model, routerId);
        assert.deepEqual(body.input_references, [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${png}` },
          },
        ]);
        if (provider === "openai") assert.equal(body.size, "1536x1024");
        else assert.equal(body.aspect_ratio, "3:2");
        if (provider === "gemini") assert.equal(body.quality, undefined);
        return Response.json({
          data: [{ b64_json: jpeg, media_type: "image/jpeg" }],
          usage: { cost: 0.073 },
        });
      },
    );
    const result = await generateImage(
      parseImageRequest(form(key, true), provider),
    );
    assert.equal(result.model, routerId);
    assert.equal(result.provider, "openrouter");
    assert.equal(result.costUsd, 0.073);
    assert.equal(imageExtension(result.data[0]!.mime_type), "jpg");
  });
}

test("switching from max/4K to Mini, Lite or Grok normalizes unsupported settings before submit", () => {
  for (const key of [
    "openai-mini",
    "gemini-nano-banana",
    "grok-imagine",
  ] as const) {
    const body = createImageForm({
      model: key,
      keySource: IMAGE_MODELS[key].provider,
      apiKey: "test",
      prompt: "edit",
      image: image(),
      size: "1024x1536",
      quality: "max",
      resolution: "4K",
    });
    const request = parseImageRequest(body, IMAGE_MODELS[key].provider);
    assert.equal(request.aspectRatio, "2:3");
    assert.equal(request.resolution, "1K");
    assert.notEqual(request.quality, "max");
  }
});

test("new quality and resolution controls reach the upstream API", async () => {
  const openai = form("openai-fast");
  openai.set("quality", "max");
  mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      assert.equal((init!.body as FormData).get("quality"), "max");
      return Response.json({ data: [{ b64_json: png }] });
    },
  );
  await generateImage(parseImageRequest(openai, "openai"));
  mock.restoreAll();
  const gemini = form("gemini-nano-banana-pro");
  gemini.set("resolution", "4K");
  mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      assert.equal(
        JSON.parse(init!.body as string).generationConfig.responseFormat.image
          .imageSize,
        "4K",
      );
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: png, mimeType: "image/png" } }],
            },
          },
        ],
      });
    },
  );
  await generateImage(parseImageRequest(gemini, "gemini"));
});

test("server rejects unsupported controls, unknown models, wrong key sources, and dropped masks", () => {
  const invalid: [ImageModelKey, string, string][] = [
    ["openai-mini", "quality", "max"],
    ["grok-imagine", "quality", "high"],
    ["gemini-nano-banana", "resolution", "4K"],
    ["openai", "model", "invented-model"],
    ["openai", "keySource", "gemini"],
    ["openai", "n", "2"],
    ["openai", "model", "__proto__"],
    ["openai", "prompt", "  "],
  ];
  for (const [key, field, value] of invalid) {
    const body = form(key);
    body.set(field, value);
    assert.throws(
      () => parseImageRequest(body, IMAGE_MODELS[key].provider),
      ImageApiError,
    );
  }
  const body = form("openai", true);
  body.set("mask", image());
  assert.throws(
    () => parseImageRequest(body, "openai"),
    /Masks are only supported/,
  );
  assert.equal(getImageModel("__proto__"), undefined);
  assert.throws(
    () => parseImageRequest(form("openai"), "gemini"),
    /does not belong/,
  );
});

test("server rejects non-files, missing/extra images, unsupported formats and oversized uploads", () => {
  const invalid = [
    "not-a-file",
    new File([], "empty.png", { type: "image/png" }),
    new File(["svg"], "file.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    }),
  ];
  for (const value of invalid) {
    const body = form("openai");
    body.set("image", value);
    assert.throws(() => parseImageRequest(body, "openai"), ImageApiError);
  }
  const body = form("openai");
  body.delete("image");
  assert.throws(() => parseImageRequest(body, "openai"), /exactly one/);
  body.append("image", image());
  body.append("image[]", image());
  assert.throws(() => parseImageRequest(body, "openai"), /exactly one/);
});

for (const status of [400, 401, 402, 403, 404, 429, 500]) {
  test(`OpenRouter ${status} never silently switches or retries models`, async () => {
    const fetch = mock.method(globalThis, "fetch", async () =>
      Response.json(
        { error: { message: "Provider rejected request" } },
        { status },
      ),
    );
    await assert.rejects(
      generateImage(
        parseImageRequest(form("gemini-nano-banana-pro", true), "gemini"),
      ),
      (error: unknown) =>
        error instanceof ImageApiError && error.status === status,
    );
    assert.equal(fetch.mock.callCount(), 1);
  });
}

test("blocked Gemini output is a user-facing error; text-only output is not treated as success", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ promptFeedback: { blockReason: "SAFETY" } }),
  );
  const request = parseImageRequest(form("gemini-nano-banana-2"), "gemini");
  await assert.rejects(generateImage(request), /content filters/);
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      candidates: [
        { content: { parts: [{ text: "Cannot produce an image" }] } },
      ],
    }),
  );
  await assert.rejects(generateImage(request), /no image/);
});

test("image signatures recover omitted MIME types and invalid cost is never shown", () => {
  assert.equal(generatedImage(jpeg, "image/png").mimeType, "image/jpeg");
  assert.equal(generatedImage(png, undefined).mimeType, "image/png");
  assert.equal(generatedImage(png, "image/png", -1).costUsd, undefined);
  assert.equal(generatedImage(png, "image/png", 0).costUsd, 0);
  assert.throws(
    () => generatedImage("not-base64!", "image/png"),
    /invalid image/,
  );
  assert.throws(
    () => generatedImage(btoa("not an image"), "image/png"),
    /invalid image/,
  );
});

test("OpenAI returned token usage and immutable settings reach the result", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      data: [{ b64_json: png }],
      usage: {
        input_tokens: 800,
        input_tokens_details: { text_tokens: 200, image_tokens: 600 },
        output_tokens: 1200,
        total_tokens: 2000,
      },
    }),
  );
  const request = parseImageRequest(form("openai"), "openai");
  const result = await generateImage(request);
  assert.equal(result.cost.status, "estimated");
  assert.ok(Math.abs(result.cost.amountUsd! - 0.0418) < 1e-10);
  assert.equal(result.cost.tokens?.total, 2000);
  assert.equal(result.settings.size, "1536x1024");
});

test("Gemini returned usage includes image, text, and thinking cost", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: png, mimeType: "image/png" } }],
          },
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 1140,
        thoughtsTokenCount: 80,
        totalTokenCount: 1320,
        candidatesTokensDetails: [
          { modality: "IMAGE", tokenCount: 1120 },
          { modality: "TEXT", tokenCount: 20 },
        ],
      },
    }),
  );
  const result = await generateImage(
    parseImageRequest(form("gemini-nano-banana-2"), "gemini"),
  );
  assert.equal(result.cost.status, "estimated");
  assert.ok(Math.abs(result.cost.amountUsd! - 0.06755) < 1e-10);
});

test("Gemini fallback counts every emitted final image without pricing extra images as text", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                thought: true,
                inlineData: { data: png, mimeType: "image/png" },
              },
              { inlineData: { data: png, mimeType: "image/png" } },
              { inlineData: { data: png, mimeType: "image/png" } },
            ],
          },
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 2240,
        totalTokenCount: 2340,
      },
    }),
  );
  const result = await generateImage(
    parseImageRequest(form("gemini-nano-banana-2"), "gemini"),
  );
  assert.equal(result.cost.status, "estimated");
  assert.ok(Math.abs(result.cost.amountUsd! - 0.13445) < 1e-10);
  assert.match(result.cost.note, /2 1K output images/);
});

test("xAI reported billing ticks reach the result as billed USD", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      data: [{ b64_json: jpeg }],
      usage: { cost_in_usd_ticks: 650_000_000 },
    }),
  );
  const result = await generateImage(
    parseImageRequest(form("grok-imagine"), "grok"),
  );
  assert.equal(result.cost.status, "reported");
  assert.equal(result.cost.amountUsd, 0.065);
  assert.equal(result.costUsd, 0.065);
});

test("OpenRouter key validation checks the authenticated key endpoint", async () => {
  mock.method(globalThis, "fetch", async (url: unknown) => {
    assert.equal(url, "https://openrouter.ai/api/v1/key");
    return Response.json(
      { error: { message: "Invalid key" } },
      { status: 401 },
    );
  });
  assert.equal(
    await validateOpenRouterApiKey("sk-or-invalid-placeholder"),
    false,
  );
});

test("direct keys take priority; OpenRouter enables every actual catalog model", () => {
  assert.equal(
    resolveKeySource("gemini-nano-banana-pro", (key) =>
      ["gemini", "openrouter"].includes(key),
    ),
    "gemini",
  );
  for (const [key] of cases)
    assert.equal(
      resolveKeySource(key, (key) => key === "openrouter"),
      "openrouter",
    );
  assert.equal(
    resolveKeySource("grok-imagine", () => false),
    null,
  );
});
