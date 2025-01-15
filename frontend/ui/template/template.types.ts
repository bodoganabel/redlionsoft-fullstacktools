import { z } from "zod";

export const TemplateSchema = z.object({
  name: z.string(),
  isFavorite: z.boolean().optional(),
});

export type TTemplate = z.infer<typeof TemplateSchema>;
