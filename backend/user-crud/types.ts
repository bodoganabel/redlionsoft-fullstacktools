import { z } from "zod";

export const UCrudResourceBaseSchema = z.object({
  _id: z.any().optional(),
  userId: z.any(),
  resourceId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  changeHistory: z.array(z.object({})).optional(),
  order: z.number().optional(), // Add order field to track position
});

type BaseDocument = z.infer<typeof UCrudResourceBaseSchema>;

export type TResource<TResourceData> = BaseDocument & {
  data: TResourceData;
};

export interface ChangeHistoryEntry {
  timestamp: string;
  previousData: Record<string, any>;
  newData: Record<string, any>;
}

export interface UserCrudServiceOptions {
  isStoreChangeHistory?: boolean;
  dataSchema: z.ZodType<any, any, any>;
}

export type WithAnyData<T> = BaseDocument & {
  data: T;
};
