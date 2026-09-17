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
