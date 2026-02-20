/**
 * Gemini image editing models (image input required).
 * Nano Banana models use generateContent API with image + text for editing.
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 * @see https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image
 * @see https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image-preview
 */

export const GEMINI_IMAGE_MODELS = {
  "gemini-nano-banana-pro": {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    description: "State-of-the-art image editing. Best for complex edits.",
  },
  "gemini-nano-banana": {
    id: "gemini-2.5-flash-image",
    name: "Nano Banana",
    description: "Fast image editing. Optimized for speed.",
  },
} as const;

export type GeminiImageModelKey = keyof typeof GEMINI_IMAGE_MODELS;
