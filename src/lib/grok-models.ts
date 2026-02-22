/**
 * Grok image generation/editing models via xAI API.
 * All models support image + text input via the /v1/images/edits endpoint.
 * @see https://docs.x.ai/developers/model-capabilities/images/generation
 */

export const GROK_IMAGE_MODELS = {
  "grok-imagine": {
    id: "grok-imagine-image",
    name: "Grok Imagine",
    description: "xAI's flagship image generation and editing model.",
  },
} as const;

export type GrokImageModelKey = keyof typeof GROK_IMAGE_MODELS;
