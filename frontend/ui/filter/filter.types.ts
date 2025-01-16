import { z } from "zod";
import { TemplateSchema, TTemplate } from "../template/template.types";
import { BaseDocumentSchema } from "../../../backend/user-crud/types";

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

export const FilterTemplateSchema = BaseDocumentSchema.extend({
  ...TemplateSchema.shape,
  filters: z.array(FilterSchema),
});

export type TFilterTemplate = TTemplate & {
  filters: TFilters;
  _id?: any;
  userId?: any;
  resourceId: string;
  createdAt: string;
  updatedAt?: string;
  changeHistory?: {}[];
  order?: number;
};
