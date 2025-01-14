import { z } from "zod";

export enum EFilterOperator {
  contains = "contains",
  is = "is",
  is_not = "is_not",
  greater_than = "greater_than",
  less_than = "less_than",
  between = "between",
  has_any_value = "has_any_value",
}

export interface IFilter {
  field: string;
  operator: EFilterOperator;
  value: string;
}

export type TFilters = IFilter[];

export const FilterSchema = z.object({
  field: z.string(),
  operator: z.nativeEnum(EFilterOperator),
  value: z.string(),
});

export const FiltersSchema = z.array(FilterSchema);

export const FilterTemplateSchema = z.object({
  name: z.string(),
  filters: FiltersSchema,
  isFavorite: z.boolean().optional(),
});

export type TFilterTemplate = z.infer<typeof FilterTemplateSchema>;
