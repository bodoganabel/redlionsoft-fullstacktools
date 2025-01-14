import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import type {
  BaseDocument,
  ChangeHistoryEntry,
  UserCrudServiceOptions,
  WithAnyData,
} from "./types";

export class UserCrudService<T extends z.ZodType<any, any, any>> {
  private collection: Collection;
  private options: UserCrudServiceOptions<T>;

  constructor(collection: Collection, options: UserCrudServiceOptions<T>) {
    this.collection = collection;
    this.options = {
      isStoreChangeHistory: false,
      ...options,
    };
  }

  private validateData(data: unknown): z.infer<T> {
    return this.options.dataSchema.parse(data);
  }

  private createChangeHistoryEntry(
    previousData: Record<string, any>,
    newData: Record<string, any>
  ): ChangeHistoryEntry {
    return {
      timestamp: new Date().toISOString(),
      previousData,
      newData,
    };
  }

  async create(request: Request): Promise<WithAnyData<T>> {
    const data = await request.json();
    const validatedData = this.validateData(data);

    const document: WithAnyData<T> = {
      createdAt: new Date().toISOString(),
      data: validatedData,
      changeHistory: [],
    };

    const result = await this.collection.insertOne(document);
    return { ...document, _id: result.insertedId };
  }

  async get(request: Request): Promise<WithAnyData<T>[]> {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const result = await this.collection.findOne({ _id: new ObjectId(id) });
      return result ? [result as WithAnyData<T>] : [];
    }

    return (await this.collection.find().toArray()) as WithAnyData<T>[];
  }

  async update(request: Request): Promise<WithAnyData<T> | null> {
    const data = await request.json();
    const { _id, ...updateData } = data;

    const validatedData = this.validateData(updateData);
    const existingDoc = await this.collection.findOne({
      _id: new ObjectId(_id),
    });

    if (!existingDoc) {
      return null;
    }

    const updateDoc: Partial<WithAnyData<T>> = {
      data: validatedData,
      updatedAt: new Date().toISOString(),
    };

    if (this.options.isStoreChangeHistory) {
      const changeHistoryEntry = this.createChangeHistoryEntry(
        existingDoc.data,
        validatedData
      );
      updateDoc.changeHistory = [
        ...(existingDoc.changeHistory || []),
        changeHistoryEntry,
      ];
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    return result?.value as WithAnyData<T> | null;
  }

  async delete(request: Request): Promise<boolean> {
    const data = await request.json();
    const result = await this.collection.deleteOne({
      _id: new ObjectId(data._id),
    });
    return result.deletedCount > 0;
  }
}
