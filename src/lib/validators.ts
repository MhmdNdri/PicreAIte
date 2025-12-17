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

export const generateGeminiSchema = z.object({
  apiKey: z.string().min(1),
  prompt: z.string().min(1),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
});

