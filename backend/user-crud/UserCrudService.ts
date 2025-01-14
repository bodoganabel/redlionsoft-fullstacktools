import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import type {
  BaseDocument,
  ChangeHistoryEntry,
  UserCrudServiceOptions,
  WithAnyData,
} from "./types";
import { json } from "@sveltejs/kit";

type ApiResponse<T> = {
  data: T;
  status: number;
};

export class UserCrudService<T extends z.ZodType<any, any, any>> {
  protected collection: Collection;
  private options: UserCrudServiceOptions<T>;

  constructor(collection: Collection, options: UserCrudServiceOptions<T>) {
    this.collection = collection;
    this.options = {
      isStoreChangeHistory: false,
      ...options,
    };
  }

  private validateData(data: unknown): z.infer<T> {
    try {
      return this.options.dataSchema.parse(data);
    } catch (error) {
      return null;
    }
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

  async create(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      const validatedData = this.validateData(data);

      if (!validatedData) {
        return json({ data: null, status: 400, error: "Invalid data format" });
      }

      const document: WithAnyData<T> = {
        createdAt: new Date().toISOString(),
        data: validatedData,
        changeHistory: [],
      };

      const result = await this.collection.insertOne(document);
      return json({
        data: { ...document, _id: result.insertedId },
        status: 200,
      });
    } catch (error) {
      return json({
        data: null,
        status: 500,
        error: "Failed to create document",
      });
    }
  }

  async get(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (id) {
        try {
          const result = await this.collection.findOne({
            _id: new ObjectId(id),
          });
          return json({
            data: result ? [result] : [],
            status: 200,
          });
        } catch (error) {
          return json({
            data: null,
            status: 400,
            error: "Invalid ID format",
          });
        }
      }

      const results = await this.collection.find().toArray();
      return json({
        data: results,
        status: 200,
      });
    } catch (error) {
      return json({
        data: null,
        status: 500,
        error: "Failed to fetch documents",
      });
    }
  }

  async update(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      const { _id, ...updateData } = data;

      if (!_id) {
        return json({
          data: null,
          status: 400,
          error: "Missing _id field",
        });
      }

      const validatedData = this.validateData(updateData);
      if (!validatedData) {
        return json({
          data: null,
          status: 400,
          error: "Invalid data format",
        });
      }

      try {
        const existingDoc = await this.collection.findOne({
          _id: new ObjectId(_id),
        });

        if (!existingDoc) {
          return json({
            data: null,
            status: 404,
            error: "Document not found",
          });
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

        return json({
          data: result?.value,
          status: 200,
        });
      } catch (error) {
        return json({
          data: null,
          status: 400,
          error: "Invalid ID format",
        });
      }
    } catch (error) {
      return json({
        data: null,
        status: 500,
        error: "Failed to update document",
      });
    }
  }

  async delete(request: Request): Promise<Response> {
    try {
      const data = await request.json();

      if (!data._id) {
        return json({
          data: null,
          status: 400,
          error: "Missing _id field",
        });
      }

      try {
        const result = await this.collection.deleteOne({
          _id: new ObjectId(data._id),
        });

        return json({
          data: { success: result.deletedCount > 0 },
          status: result.deletedCount > 0 ? 200 : 404,
        });
      } catch (error) {
        return json({
          data: null,
          status: 400,
          error: "Invalid ID format",
        });
      }
    } catch (error) {
      return json({
        data: null,
        status: 500,
        error: "Failed to delete document",
      });
    }
  }
}
