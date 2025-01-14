import { ObjectId } from "mongodb";
import { z } from "zod";

export interface BaseDocument {
  _id?: ObjectId;
  userId: ObjectId;
  resourceId: string;
  createdAt: string;
  updatedAt?: string;
  changeHistory?: ChangeHistoryEntry[];
}

export interface ChangeHistoryEntry {
  timestamp: string;
  previousData: Record<string, any>;
  newData: Record<string, any>;
}

export interface UserCrudServiceOptions<T extends z.ZodType<any, any, any>> {
  isStoreChangeHistory?: boolean;
  dataSchema: T;
}

export type WithAnyData<T> = BaseDocument & {
  data: T;
};
