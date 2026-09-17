import { IMAGE_MODELS, MODEL_CATALOG_CHECKED_AT } from "./image-models";
import type { ImageEditRequest } from "./image-request";

export interface CostLineItem {
  label: string;
  quantity: number;
  unit: "tokens" | "images";
  /** USD per token or image, before display rounding. */
  rateUsd: number;
  amountUsd: number;
}

export interface ImageCost {
  status: "reported" | "estimated" | "partial" | "unavailable";
  amountUsd?: number;
  lineItems: CostLineItem[];
  note: string;
  sourceUrl: string;
  checkedAt: string;
  tokens?: {
    input?: number;
    output?: number;
    thinking?: number;
    total?: number;
  };
}

// Standard synchronous API rates, USD per million tokens. Sources are the
// model's pricingUrl in image-models.ts; update rates and checked date together.
const OPENAI_RATES = {
  openai: { text: 5, image: 8, output: 30 },
  "openai-fast": { text: 5, image: 8, output: 30 },
  "openai-mini": { text: 2, image: 2.5, output: 8 },
} as const;
const GEMINI_RATES = {
  "gemini-nano-banana-2": {
    input: 0.5,
    text: 3,
    image: 60,
    imageTokens: { "1K": 1120, "2K": 1680, "4K": 2520 },
  },
  "gemini-nano-banana": {
    input: 0.25,
    text: 1.5,
    image: 30,
    imageTokens: { "1K": 1120, "2K": 1120, "4K": 1120 },
  },
  "gemini-nano-banana-pro": {
    input: 2,
    text: 12,
    image: 120,
    imageTokens: { "1K": 1120, "2K": 1120, "4K": 2000 },
  },
} as const;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function count(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}
function money(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}
function tokenItem(
  label: string,
  quantity: number,
  rate: number,
): CostLineItem {
  return {
    label,
    quantity,
    unit: "tokens",
    rateUsd: rate / 1_000_000,
    amountUsd: (quantity * rate) / 1_000_000,
  };
}

/** Cost of one successful edit. Missing usage is unknown, never a free request. */
export function calculateImageCost(
  request: ImageEditRequest,
  rawUsage: unknown,
  outputImages = 1,
): ImageCost {
  const model = IMAGE_MODELS[request.model];
  const usage = record(rawUsage);
  const base = {
    sourceUrl:
      request.keySource === "openrouter"
        ? `https://openrouter.ai/${model.openRouterId}`
        : model.pricingUrl,
    checkedAt: MODEL_CATALOG_CHECKED_AT,
  };
  const unavailable = (note: string): ImageCost => ({
    ...base,
    status: "unavailable",
    lineItems: [],
    note,
  });
  const estimate = (
    lineItems: CostLineItem[],
    complete: boolean,
    note: string,
    tokens?: ImageCost["tokens"],
  ): ImageCost =>
    lineItems.length
      ? {
          ...base,
          status: complete ? "estimated" : "partial",
          amountUsd: lineItems.reduce((sum, item) => sum + item.amountUsd, 0),
          lineItems,
          note,
          tokens,
        }
      : unavailable(note);

  if (request.keySource === "openrouter") {
    const amountUsd = money(usage.cost);
    if (amountUsd === undefined)
      return unavailable(
        "OpenRouter did not report a charge. Direct-provider rates cannot reliably price a routed request; check OpenRouter Activity.",
      );
    return {
      ...base,
      status: "reported",
      amountUsd,
      lineItems: [],
      note: "Request cost reported by OpenRouter. Account-level fees and taxes are separate.",
      tokens: {
        input: count(usage.prompt_tokens),
        output: count(usage.completion_tokens),
        total: count(usage.total_tokens),
      },
    };
  }

  if (model.provider === "grok") {
    const ticks = count(usage.cost_in_usd_ticks);
    if (ticks !== undefined)
      return {
        ...base,
        status: "reported",
        amountUsd: ticks / 10_000_000_000,
        lineItems: [],
        note: "Billed request cost reported by xAI, including provider discounts.",
      };
    const outputRate =
      (request.quality === "low" ? 0.04 : 0.06) +
      (request.resolution === "2K" ? 0.02 : 0);
    return estimate(
      [
        {
          label: "Input image",
          quantity: 1,
          unit: "images",
          rateUsd: 0.01,
          amountUsd: 0.01,
        },
        {
          label: `Output image (${request.resolution}, ${request.quality})`,
          quantity: 1,
          unit: "images",
          rateUsd: outputRate,
          amountUsd: outputRate,
        },
      ],
      true,
      "Estimated from one input and one output image at the requested quality and resolution. xAI prices these images per image, not per token; discounts can lower the bill.",
    );
  }

  if (model.provider === "openai") {
    if (
      ["input_tokens", "output_tokens", "total_tokens"].some(
        (key) => Object.hasOwn(usage, key) && count(usage[key]) === undefined,
      )
    )
      return unavailable(
        "OpenAI returned invalid token counts, so a reliable total cannot be calculated.",
      );
    const rates = OPENAI_RATES[request.model as keyof typeof OPENAI_RATES];
    const input = record(usage.input_tokens_details);
    const output = record(usage.output_tokens_details);
    const textTokens = count(input.text_tokens);
    const imageTokens = count(input.image_tokens);
    const outputTokens = Object.hasOwn(usage, "output_tokens_details")
      ? count(output.image_tokens)
      : count(usage.output_tokens);
    const inputTotal = count(usage.input_tokens);
    const outputTotal = count(usage.output_tokens);
    const total = count(usage.total_tokens);
    if (
      (inputTotal !== undefined &&
        textTokens !== undefined &&
        imageTokens !== undefined &&
        textTokens + imageTokens !== inputTotal) ||
      (outputTotal !== undefined &&
        outputTokens !== undefined &&
        outputTokens > outputTotal) ||
      (total !== undefined &&
        inputTotal !== undefined &&
        outputTotal !== undefined &&
        total !== inputTotal + outputTotal)
    )
      return unavailable(
        "OpenAI returned inconsistent token counts, so a reliable total cannot be calculated.",
      );
    const items: CostLineItem[] = [];
    if (textTokens !== undefined)
      items.push(tokenItem("Text input", textTokens, rates.text));
    if (imageTokens !== undefined)
      items.push(tokenItem("Image input", imageTokens, rates.image));
    if (outputTokens !== undefined)
      items.push(tokenItem("Image output", outputTokens, rates.output));
    const complete =
      textTokens !== undefined &&
      imageTokens !== undefined &&
      outputTokens !== undefined;
    return estimate(
      items,
      complete,
      complete
        ? "Estimated from returned token usage at standard rates. OpenAI does not expose a documented image-cache breakdown here; cache discounts can lower the bill."
        : "Only the reported token categories are priced. Missing input or output usage is excluded; this is not the full request cost.",
      {
        input:
          inputTotal ??
          (textTokens !== undefined && imageTokens !== undefined
            ? textTokens + imageTokens
            : undefined),
        output: outputTotal,
        total,
      },
    );
  }

  const rates = GEMINI_RATES[request.model as keyof typeof GEMINI_RATES];
  if (
    [
      "promptTokenCount",
      "candidatesTokenCount",
      "thoughtsTokenCount",
      "totalTokenCount",
    ].some(
      (key) => Object.hasOwn(usage, key) && count(usage[key]) === undefined,
    )
  )
    return unavailable(
      "Gemini returned invalid token counts, so a reliable total cannot be calculated.",
    );
  const prompt = count(usage.promptTokenCount);
  const candidates = count(usage.candidatesTokenCount);
  const total = count(usage.totalTokenCount);
  let thinking = Object.hasOwn(usage, "thoughtsTokenCount")
    ? count(usage.thoughtsTokenCount)
    : undefined;
  if (!Object.hasOwn(usage, "thoughtsTokenCount")) {
    thinking =
      total !== undefined && prompt !== undefined && candidates !== undefined
        ? count(total - prompt - candidates)
        : 0;
  }
  if (
    total !== undefined &&
    prompt !== undefined &&
    candidates !== undefined &&
    (thinking === undefined || total !== prompt + candidates + thinking)
  )
    return unavailable(
      "Gemini returned inconsistent token counts, so a reliable total cannot be calculated.",
    );
  let imageTokens: number | undefined;
  let assumedImageTokens = false;
  if (Array.isArray(usage.candidatesTokensDetails)) {
    const details = usage.candidatesTokensDetails.map(record);
    if (details.some((part) => count(part.tokenCount) === undefined))
      return unavailable("Gemini returned invalid output token details.");
    const imageDetails = details.filter((part) => part.modality === "IMAGE");
    if (imageDetails.length)
      imageTokens = imageDetails.reduce(
        (sum, part) => sum + (count(part.tokenCount) ?? 0),
        0,
      );
    const detailsTotal = details.reduce(
      (sum, part) => sum + (count(part.tokenCount) ?? 0),
      0,
    );
    if (candidates !== undefined && detailsTotal > candidates)
      return unavailable("Gemini returned inconsistent output token details.");
  }
  if (imageTokens === undefined) {
    imageTokens = rates.imageTokens[request.resolution] * outputImages;
    assumedImageTokens = true;
  }
  if (candidates !== undefined && imageTokens > candidates)
    return unavailable(
      "Gemini's output usage does not match the image token count. Check your provider account for the charge.",
    );
  const items: CostLineItem[] = [];
  if (prompt !== undefined)
    items.push(tokenItem("Text and image input", prompt, rates.input));
  items.push(
    tokenItem(
      assumedImageTokens ? "Image output (estimated tokens)" : "Image output",
      imageTokens,
      rates.image,
    ),
  );
  if (candidates !== undefined)
    items.push(tokenItem("Text output", candidates - imageTokens, rates.text));
  if (thinking !== undefined && (thinking > 0 || candidates !== undefined))
    items.push(tokenItem("Thinking", thinking, rates.text));
  const complete =
    prompt !== undefined && candidates !== undefined && thinking !== undefined;
  return estimate(
    items,
    complete,
    (assumedImageTokens
      ? `Image tokens use Google's published count for ${outputImages} ${request.resolution} output image${outputImages === 1 ? "" : "s"}. `
      : "Calculated from returned input, image, text and thinking tokens. ") +
      (complete
        ? "Estimate at standard paid API rates; your provider account is authoritative."
        : "Missing input or text/thinking usage is excluded; this is only a partial estimate."),
    { input: prompt, output: candidates, thinking, total },
  );
}
