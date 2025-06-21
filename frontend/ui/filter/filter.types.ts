import { z } from "zod/v4";
import { UCrudResourceBaseSchema } from "../../../backend/user-crud/types";

export type TFilterOperator = {
  value: EFilterOperator;
  label: string;
};

export type TFilterField = {
  value: string;
  label: string;
};

export enum EFilterOperator {
  contains = "contains",
  is = "is",
  is_not = "is_not",
  greater_than = "greater_than",
  less_than = "less_than",
  between = "between",
  has_any_value = "has_any_value",
}

export const FilterSchema = z.object({
  field: z.string(),
  operator: z.nativeEnum(EFilterOperator),
  value: z.string(),
});

export type TFilter = z.infer<typeof FilterSchema>;

// Template data schema (what goes inside the data property)
export const FilterTemplateDataSchema = z.object({
  isFavorite: z.boolean().optional(),
  filters: z.array(FilterSchema),
});
export type TFilterTemplateData = z.infer<typeof FilterTemplateDataSchema>;

// Full document schema including the UserCrud wrapper
export const FilterTemplateResourceSchema = UCrudResourceBaseSchema.extend({
  data: FilterTemplateDataSchema,
});

export type TFilterTemplateResource = z.infer<
  typeof FilterTemplateResourceSchema
>;
