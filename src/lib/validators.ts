import { z } from "zod";

export const promptInsertSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  promptDesc: z.string().min(1),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  originalImage: z.string().url().optional().nullable(),
});

export const promptUpdateSchema = promptInsertSchema
  .extend({
    id: z.string().uuid(),
  })
  .partial({
    description: true,
    imageUrl: true,
    originalImage: true,
  });

export const promptDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const generateOpenAiSchema = z.object({
  apiKey: z.string().min(1),
  prompt: z.string().min(1),
  model: z.string().min(1).optional(),
  n: z.coerce.number().int().min(1).max(10).optional(),
  quality: z.enum(["auto", "low", "medium", "high"]).optional(),
  size: z.string().min(1).optional(),
  user: z.string().optional(),
});

export const GEMINI_MODEL_KEYS = [
  "gemini-nano-banana-pro",
  "gemini-nano-banana",
] as const;

export const generateGeminiSchema = z.object({
  apiKey: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(GEMINI_MODEL_KEYS),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
});

export const GROK_MODEL_KEYS = ["grok-imagine"] as const;

export const generateGrokSchema = z.object({
  apiKey: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(GROK_MODEL_KEYS),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
});

export const OPENROUTER_MODEL_KEYS = [
  "openrouter-gpt-image-1",
  "openrouter-gpt-image-1-mini",
] as const;

export const generateOpenRouterSchema = z.object({
  apiKey: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(OPENROUTER_MODEL_KEYS),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
  sourceProvider: z.enum(["openai", "gemini", "grok", "openrouter"]).optional(),
});

