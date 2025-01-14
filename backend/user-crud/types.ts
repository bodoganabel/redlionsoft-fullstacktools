import { z } from "zod";

export const BaseDocumentSchema = z.object({
  _id: z.any().optional(),
  userId: z.any(),
  resourceId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  changeHistory: z.array(z.object({})).optional(),
});

export type BaseDocument = z.infer<typeof BaseDocumentSchema>;

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
