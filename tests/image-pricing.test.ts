import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateImageCost } from "../src/lib/image-pricing";
import type { ImageEditRequest } from "../src/lib/image-request";
import type { ImageModelKey, ImageProvider } from "../src/lib/image-models";

// Independent fixtures from provider pricing verified on 2026-09-17. These
// exercise accounting contracts, without network requests or real credentials.
const modelProviders: [ImageModelKey, ImageProvider][] = [
  ["openai", "openai"],
  ["openai-fast", "openai"],
  ["openai-mini", "openai"],
  ["gemini-nano-banana-2", "gemini"],
  ["gemini-nano-banana", "gemini"],
  ["gemini-nano-banana-pro", "gemini"],
  ["grok-imagine", "grok"],
];

function request(
  model: ImageModelKey,
  overrides: Partial<ImageEditRequest> = {},
): ImageEditRequest {
  const provider = modelProviders.find(([key]) => key === model)![1];
  return {
    model,
    apiKey: "test-placeholder",
    prompt: "Turn the photograph into a watercolor painting.",
    size: "1024x1024",
    aspectRatio: "1:1",
    quality: provider === "grok" ? "medium" : "high",
    resolution: "1K",
    keySource: provider,
    image: new File([new Uint8Array([1])], "photo.png", { type: "image/png" }),
    mask: undefined,
    ...overrides,
  };
}

function close(actual: number | undefined, expected: number) {
  assert.equal(typeof actual, "number");
  assert.ok(
    Math.abs(actual! - expected) < 1e-10,
    `Expected ${expected}, received ${actual}`,
  );
}

function assertSafeIncomplete(cost: ReturnType<typeof calculateImageCost>) {
  assert.ok(
    cost.status === "partial" || cost.status === "unavailable",
    `Incomplete or invalid usage was presented as ${cost.status}`,
  );
  if (cost.amountUsd !== undefined) {
    assert.ok(Number.isFinite(cost.amountUsd) && cost.amountUsd >= 0);
  }
  for (const item of cost.lineItems) {
    assert.ok(Number.isFinite(item.quantity) && item.quantity >= 0);
    assert.ok(Number.isFinite(item.amountUsd) && item.amountUsd >= 0);
  }
}

for (const [model, textInputRate, imageInputRate, imageOutputRate] of [
  ["openai", 5, 8, 30],
  ["openai-fast", 5, 8, 30],
  ["openai-mini", 2, 2.5, 8],
] as const) {
  test(`${model}: accounts for actual text, image input and image output tokens`, () => {
    const cost = calculateImageCost(request(model), {
      input_tokens: 800,
      input_tokens_details: { text_tokens: 200, image_tokens: 600 },
      output_tokens: 1200,
      total_tokens: 2000,
    });
    assert.equal(cost.status, "estimated");
    close(
      cost.amountUsd,
      (200 * textInputRate + 600 * imageInputRate + 1200 * imageOutputRate) /
        1_000_000,
    );
    close(
      cost.lineItems.reduce((sum, item) => sum + item.amountUsd, 0),
      cost.amountUsd!,
    );
    assert.equal(cost.tokens?.input, 800);
    assert.equal(cost.tokens?.total, 2000);
    assert.match(cost.sourceUrl, /^https:\/\//);
    assert.match(cost.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(cost.note.length > 0);
  });
}

test("OpenAI image output breakdown takes priority over the aggregate output count", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens: 800,
    input_tokens_details: { text_tokens: 200, image_tokens: 600 },
    output_tokens: 1400,
    output_tokens_details: { image_tokens: 1200, text_tokens: 200 },
    total_tokens: 2200,
  });
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0.0418);
});

test("OpenAI missing usage is unavailable, never a fabricated zero-dollar generation", () => {
  const cost = calculateImageCost(request("openai"), undefined);
  assert.equal(cost.status, "unavailable");
  assert.equal(cost.amountUsd, undefined);
});

test("OpenAI aggregate input alone cannot be charged as if it were all text", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens: 800,
    output_tokens: 1200,
    total_tokens: 2000,
  });
  assertSafeIncomplete(cost);
});

test("OpenAI a missing input modality remains incomplete when there is no total to derive it", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens_details: { image_tokens: 600 },
    output_tokens: 1200,
  });
  assertSafeIncomplete(cost);
});

test("OpenAI does not round small token costs to zero before presentation", () => {
  const cost = calculateImageCost(request("openai-mini"), {
    input_tokens: 2,
    input_tokens_details: { text_tokens: 1, image_tokens: 1 },
    output_tokens: 1,
    total_tokens: 3,
  });
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0.0000125);
});

test("OpenAI explicitly reported zero token counts remain valid", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens: 0,
    input_tokens_details: { text_tokens: 0, image_tokens: 0 },
    output_tokens: 0,
    total_tokens: 0,
  });
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0);
});

const geminiUsage = {
  promptTokenCount: 600,
  candidatesTokenCount: 1220,
  thoughtsTokenCount: 200,
  totalTokenCount: 2020,
  promptTokensDetails: [
    { modality: "TEXT", tokenCount: 40 },
    { modality: "IMAGE", tokenCount: 560 },
  ],
  candidatesTokensDetails: [
    { modality: "TEXT", tokenCount: 100 },
    { modality: "IMAGE", tokenCount: 1120 },
  ],
};

for (const [model, inputRate, textOutputRate, imageOutputRate] of [
  ["gemini-nano-banana-2", 0.5, 3, 60],
  ["gemini-nano-banana", 0.25, 1.5, 30],
  ["gemini-nano-banana-pro", 2, 12, 120],
] as const) {
  test(`${model}: charges image, text, and thinking at their separate rates`, () => {
    const cost = calculateImageCost(request(model), geminiUsage);
    assert.equal(cost.status, "estimated");
    close(
      cost.amountUsd,
      (600 * inputRate + 300 * textOutputRate + 1120 * imageOutputRate) /
        1_000_000,
    );
    close(
      cost.lineItems.reduce((sum, item) => sum + item.amountUsd, 0),
      cost.amountUsd!,
    );
    assert.equal(cost.tokens?.input, 600);
    assert.equal(cost.tokens?.thinking, 200);
    assert.equal(
      cost.tokens?.total,
      2020,
      "Thinking must not be counted twice",
    );
  });
}

test("Gemini can derive omitted thinking from a complete total without counting it twice", () => {
  const { thoughtsTokenCount, ...usage } = geminiUsage;
  const cost = calculateImageCost(request("gemini-nano-banana-2"), usage);
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0.0684);
  assert.equal(cost.tokens?.thinking, thoughtsTokenCount);
  assert.equal(cost.tokens?.total, 2020);
});

test("Gemini actual image-token metadata wins over nominal resolution-based output pricing", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), {
    ...geminiUsage,
    candidatesTokenCount: 1600,
    totalTokenCount: 2400,
    candidatesTokensDetails: [
      { modality: "TEXT", tokenCount: 100 },
      { modality: "IMAGE", tokenCount: 1500 },
    ],
  });
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0.0912);
});

for (const [model, resolution, imageTokens, expectedOutputUsd] of [
  ["gemini-nano-banana-2", "1K", 1120, 0.0672],
  ["gemini-nano-banana-2", "2K", 1680, 0.1008],
  ["gemini-nano-banana-2", "4K", 2520, 0.1512],
  ["gemini-nano-banana", "1K", 1120, 0.0336],
  ["gemini-nano-banana-pro", "1K", 1120, 0.1344],
  ["gemini-nano-banana-pro", "2K", 1120, 0.1344],
  ["gemini-nano-banana-pro", "4K", 2000, 0.24],
] as const) {
  test(`${model} ${resolution}: nominal image fallback retains exact token-based price`, () => {
    const cost = calculateImageCost(request(model, { resolution }), {
      promptTokenCount: 0,
      candidatesTokenCount: imageTokens,
      thoughtsTokenCount: 0,
      totalTokenCount: imageTokens,
    });
    assert.equal(cost.status, "estimated");
    close(cost.amountUsd, expectedOutputUsd);
    assert.match(
      cost.note,
      /assum|resolution|nominal|infer|standard|fallback/i,
    );
  });
}

test("Gemini missing usage leaves output pricing explicitly partial", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), undefined);
  assertSafeIncomplete(cost);
  if (cost.amountUsd !== undefined) close(cost.amountUsd, 0.0672);
});

test("Gemini too-small aggregate output cannot support a nominal one-image token estimate", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), {
    promptTokenCount: 600,
    candidatesTokenCount: 100,
    thoughtsTokenCount: 200,
    totalTokenCount: 900,
  });
  assertSafeIncomplete(cost);
});

test("Gemini explicitly reported zero tokens do not trigger nominal output pricing", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    thoughtsTokenCount: 0,
    totalTokenCount: 0,
    candidatesTokensDetails: [
      { modality: "TEXT", tokenCount: 0 },
      { modality: "IMAGE", tokenCount: 0 },
    ],
  });
  assert.equal(cost.status, "estimated");
  close(cost.amountUsd, 0);
});

for (const [quality, resolution, expectedUsd] of [
  ["low", "1K", 0.05],
  ["low", "2K", 0.07],
  ["medium", "1K", 0.07],
  ["medium", "2K", 0.09],
] as const) {
  test(`Grok ${resolution} ${quality}: estimate includes both the input image and output image`, () => {
    const cost = calculateImageCost(
      request("grok-imagine", { quality, resolution }),
      undefined,
    );
    assert.equal(cost.status, "estimated");
    close(cost.amountUsd, expectedUsd);
    close(
      cost.lineItems.reduce((sum, item) => sum + item.amountUsd, 0),
      expectedUsd,
    );
  });
}

test("Grok billed ticks override a settings estimate and preserve sub-cent precision", () => {
  const cost = calculateImageCost(
    request("grok-imagine", { quality: "medium", resolution: "2K" }),
    { cost_in_usd_ticks: 123456789 },
  );
  assert.equal(cost.status, "reported");
  close(cost.amountUsd, 0.0123456789);
});

test("Grok preserves a reported zero-dollar cost", () => {
  const cost = calculateImageCost(request("grok-imagine"), {
    cost_in_usd_ticks: 0,
  });
  assert.equal(cost.status, "reported");
  close(cost.amountUsd, 0);
});

for (const [model] of modelProviders) {
  test(`${model} via OpenRouter: preserves routed billed USD instead of applying direct pricing`, () => {
    const cost = calculateImageCost(
      request(model, { keySource: "openrouter", apiKey: "sk-or-test" }),
      {
        cost: 0.123456789,
        prompt_tokens: 25,
        completion_tokens: 1000,
        total_tokens: 1025,
      },
    );
    assert.equal(cost.status, "reported");
    close(cost.amountUsd, 0.123456789);
  });
}

test("OpenRouter reported zero is valid even with nonzero token counts", () => {
  const cost = calculateImageCost(
    request("openai", { keySource: "openrouter" }),
    {
      cost: 0,
      prompt_tokens: 500,
      completion_tokens: 1000,
      total_tokens: 1500,
    },
  );
  assert.equal(cost.status, "reported");
  close(cost.amountUsd, 0);
});

test("OpenRouter aggregate tokens without cost cannot be converted using a direct provider tariff", () => {
  const cost = calculateImageCost(
    request("gemini-nano-banana-pro", { keySource: "openrouter" }),
    { prompt_tokens: 500, completion_tokens: 1500, total_tokens: 2000 },
  );
  assert.equal(cost.status, "unavailable");
  assert.equal(cost.amountUsd, undefined);
});

for (const invalid of [
  -1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  "0.12",
  null,
]) {
  test(`OpenRouter rejects invalid reported cost ${String(invalid)}`, () => {
    const cost = calculateImageCost(
      request("openai", { keySource: "openrouter" }),
      { cost: invalid },
    );
    assert.equal(cost.status, "unavailable");
    assert.equal(cost.amountUsd, undefined);
  });

  test(`Grok invalid reported ticks ${String(invalid)} use a labeled estimate`, () => {
    const cost = calculateImageCost(request("grok-imagine"), {
      cost_in_usd_ticks: invalid,
    });
    assert.equal(cost.status, "estimated");
    close(cost.amountUsd, 0.07);
  });
}

for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, "600"]) {
  test(`OpenAI invalid input token count ${String(invalid)} cannot produce a complete estimate`, () => {
    const cost = calculateImageCost(request("openai"), {
      input_tokens: 800,
      input_tokens_details: { text_tokens: 200, image_tokens: invalid },
      output_tokens: 1200,
      total_tokens: 2000,
    });
    assertSafeIncomplete(cost);
  });

  test(`Gemini invalid thinking token count ${String(invalid)} cannot produce a complete estimate`, () => {
    const cost = calculateImageCost(request("gemini-nano-banana-2"), {
      ...geminiUsage,
      thoughtsTokenCount: invalid,
    });
    assertSafeIncomplete(cost);
  });
}

test("OpenAI inconsistent modality subtotals cannot be presented as complete usage", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens: 100,
    input_tokens_details: { text_tokens: 200, image_tokens: 600 },
    output_tokens: 1200,
    total_tokens: 1300,
  });
  assertSafeIncomplete(cost);
});

test("Gemini inconsistent candidate modalities cannot be presented as complete usage", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), {
    ...geminiUsage,
    candidatesTokenCount: 100,
    totalTokenCount: 900,
  });
  assertSafeIncomplete(cost);
});

test("OpenAI does not silently ignore an invalid supplied aggregate count", () => {
  const cost = calculateImageCost(request("openai"), {
    input_tokens: -1,
    input_tokens_details: { text_tokens: 200, image_tokens: 600 },
    output_tokens: 1200,
  });
  assertSafeIncomplete(cost);
});

test("Gemini does not silently ignore an invalid supplied total count", () => {
  const cost = calculateImageCost(request("gemini-nano-banana-2"), {
    ...geminiUsage,
    totalTokenCount: -1,
  });
  assertSafeIncomplete(cost);
});
