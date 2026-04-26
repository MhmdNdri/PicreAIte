/**
 * OpenRouter image models.
 * IDs follow OpenRouter model naming (provider/model).
 * @see https://openrouter.ai/models
 */
export const OPENROUTER_IMAGE_MODELS = {
  "openrouter-gpt-image-2": {
    id: "openai/gpt-image-2",
    name: "OpenRouter GPT-Image-2",
    description:
      "Latest GPT Image editing via OpenRouter. Falls back to gpt-image-1 if unavailable.",
  },
  "openrouter-gpt-image-1": {
    id: "openai/gpt-image-1",
    name: "OpenRouter GPT-Image-1",
    description:
      "OpenAI image editing via OpenRouter. Good default for fallback usage.",
  },
  "openrouter-gpt-image-1-mini": {
    id: "openai/gpt-image-1-mini",
    name: "OpenRouter GPT-Image-1 Mini",
    description: "Lower-cost OpenAI image editing via OpenRouter.",
  },
} as const;

export type OpenRouterImageModelKey = keyof typeof OPENROUTER_IMAGE_MODELS;

