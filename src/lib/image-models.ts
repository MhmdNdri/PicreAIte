/** Verified against the linked provider docs and OpenRouter catalog on this date. */
export const MODEL_CATALOG_CHECKED_AT = "2026-09-17";
export type ImageProvider = "openai" | "gemini" | "grok";
export type ApiKeySource = ImageProvider | "openrouter";
export type ImageQuality = "low" | "medium" | "high" | "xhigh" | "max";
export type ImageResolution = "1K" | "2K" | "4K";
export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";
export type ImageAspectRatio = "1:1" | "3:2" | "2:3";

export interface ImageModel {
  provider: ImageProvider;
  id: string;
  openRouterId: string;
  name: string;
  tier: string;
  description: string;
  pricing: string;
  pricingUrl: string;
  qualities: readonly ImageQuality[];
  resolutions: readonly ImageResolution[];
  defaultQuality: ImageQuality;
}

const openaiPricing =
  "Per 1M tokens: $5 text input, $8 image input, $30 image output. Total varies by size and quality.";
const googlePricingUrl = "https://ai.google.dev/gemini-api/docs/pricing";

// Keep UI keys stable; all executable model IDs and capabilities live here.
export const IMAGE_MODELS = {
  openai: {
    provider: "openai",
    id: "gpt-image-2.5-sunburst",
    openRouterId: "openai/gpt-image-2.5-sunburst",
    name: "GPT Image 2.5 Sunburst",
    tier: "Precision",
    description:
      "Detailed edits where precision and faithful changes matter most.",
    pricing: openaiPricing,
    pricingUrl:
      "https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst",
    qualities: ["low", "medium", "high", "xhigh", "max"],
    resolutions: [],
    defaultQuality: "high",
  },
  "openai-fast": {
    provider: "openai",
    id: "gpt-image-2.5-flare",
    openRouterId: "openai/gpt-image-2.5-flare",
    name: "GPT Image 2.5 Flare",
    tier: "Fast",
    description:
      "Faster everyday image creation and editing. Same token rates as Sunburst; usage can differ.",
    pricing: openaiPricing,
    pricingUrl:
      "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
    qualities: ["low", "medium", "high", "xhigh", "max"],
    resolutions: [],
    defaultQuality: "high",
  },
  "openai-mini": {
    provider: "openai",
    id: "gpt-image-1-mini",
    openRouterId: "openai/gpt-image-1-mini",
    name: "GPT Image 1 Mini",
    tier: "Budget",
    description:
      "The existing lower-cost OpenAI option for drafts and simple transformations.",
    pricing:
      "Per 1M tokens: $2 text input, $2.50 image input, $8 image output. Total varies by size and quality.",
    pricingUrl:
      "https://developers.openai.com/api/docs/models/gpt-image-1-mini",
    qualities: ["low", "medium", "high"],
    resolutions: [],
    defaultQuality: "high",
  },
  "gemini-nano-banana-2": {
    provider: "gemini",
    id: "gemini-3.1-flash-image",
    openRouterId: "google/gemini-3.1-flash-image",
    name: "Nano Banana 2",
    tier: "Balanced",
    description:
      "General-purpose editing with a balance of quality and speed; supports up to 4K output.",
    pricing:
      "Image output: about $0.067 at 1K, $0.101 at 2K, $0.151 at 4K, plus input and text/thinking tokens.",
    pricingUrl: googlePricingUrl,
    qualities: [],
    resolutions: ["1K", "2K", "4K"],
    defaultQuality: "high",
  },
  "gemini-nano-banana": {
    provider: "gemini",
    id: "gemini-3.1-flash-lite-image",
    openRouterId: "google/gemini-3.1-flash-lite-image",
    name: "Nano Banana 2 Lite",
    tier: "Budget / fast",
    description:
      "Quick, lower-cost edits at 1K. Replaces the original Nano Banana budget option.",
    pricing:
      "Image output: $0.0336 at 1K, plus input and text/thinking tokens.",
    pricingUrl: googlePricingUrl,
    qualities: [],
    resolutions: ["1K"],
    defaultQuality: "high",
  },
  "gemini-nano-banana-pro": {
    provider: "gemini",
    id: "gemini-3-pro-image",
    openRouterId: "google/gemini-3-pro-image",
    name: "Nano Banana Pro",
    tier: "Complex edits",
    description:
      "Professional assets, detailed instructions, and complex compositions; supports up to 4K.",
    pricing:
      "Image output: $0.134 at 1K/2K or $0.24 at 4K, plus input and text/thinking tokens.",
    pricingUrl: googlePricingUrl,
    qualities: [],
    resolutions: ["1K", "2K", "4K"],
    defaultQuality: "high",
  },
  "grok-imagine": {
    provider: "grok",
    id: "grok-imagine-image-2.0",
    openRouterId: "x-ai/grok-imagine-image-2.0",
    name: "Grok Imagine Image 2.0",
    tier: "Creative edits",
    description:
      "xAI image transformations with low/medium quality and 1K/2K output controls.",
    pricing:
      "Output: 1K low $0.04; 2K low or 1K medium $0.06; 2K medium $0.08. Add $0.01 per input image.",
    pricingUrl: "https://docs.x.ai/developers/models/grok-imagine-image-2.0",
    qualities: ["low", "medium"],
    resolutions: ["1K", "2K"],
    defaultQuality: "medium",
  },
} as const satisfies Record<string, ImageModel>;

export type ImageModelKey = keyof typeof IMAGE_MODELS;
export const IMAGE_MODEL_KEYS = Object.keys(IMAGE_MODELS) as [
  ImageModelKey,
  ...ImageModelKey[],
];

export function getImageModel(key: string | undefined): ImageModel | undefined {
  return key && Object.hasOwn(IMAGE_MODELS, key)
    ? IMAGE_MODELS[key as ImageModelKey]
    : undefined;
}

export const ASPECT_RATIO_BY_SIZE: Record<ImageSize, ImageAspectRatio> = {
  "1024x1024": "1:1",
  "1536x1024": "3:2",
  "1024x1536": "2:3",
};

export function getModelSettings(
  key: ImageModelKey,
  quality: ImageQuality,
  resolution: ImageResolution,
) {
  const model: ImageModel = IMAGE_MODELS[key];
  return {
    quality: model.qualities.includes(quality) ? quality : model.defaultQuality,
    resolution: model.resolutions.includes(resolution)
      ? resolution
      : ("1K" as const),
  };
}

export function resolveKeySource(
  model: ImageModelKey,
  hasKey: (source: ApiKeySource) => boolean,
): ApiKeySource | null {
  const provider = IMAGE_MODELS[model].provider;
  if (hasKey(provider)) return provider;
  return hasKey("openrouter") ? "openrouter" : null;
}
