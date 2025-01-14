import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import type {
  BaseDocument,
  ChangeHistoryEntry,
  UserCrudServiceOptions,
  WithAnyData,
} from "./types";
import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import type { Cookies } from "@sveltejs/kit";

export class UserCrudService<T extends z.ZodType<any, any, any>> {
  protected collection: Collection;
  private options: UserCrudServiceOptions<T>;
  private authService: AuthService<any, any, any, any>;

  constructor(
    collection: Collection,
    authService: AuthService<any, any, any, any>,
    options: UserCrudServiceOptions<T>
  ) {
    this.collection = collection;
    this.authService = authService;
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

  async create(request: Request, cookies: Cookies): Promise<Response> {
    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();
      console.log("data:");
      console.log(data);
      const validatedData = this.validateData(data);

      if (!validatedData) {
        return json({ error: "Invalid data format" }, { status: 400 });
      }

      const document: WithAnyData<z.infer<T>> = {
        userId: user._id,
        resourceId: data.resourceId || "default",
        createdAt: new Date().toISOString(),
        data: validatedData,
        changeHistory: [],
      };

      const result = await this.collection.insertOne(document);
      return json({ ...document, _id: result.insertedId }, { status: 200 });
    } catch (error) {
      return json({ error: "Failed to create document" }, { status: 500 });
    }
  }

  async get(request: Request, cookies: Cookies): Promise<Response> {
    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const resourceId = url.searchParams.get("resourceId");

      if (resourceId) {
        try {
          const result = await this.collection.findOne({
            userId: user._id,
            resourceId,
          });
          return json(result ? [result] : [], { status: 200 });
        } catch (error) {
          return json({ error: "Invalid resourceId format" }, { status: 400 });
        }
      }

      const results = await this.collection
        .find({ userId: user._id })
        .toArray();
      return json(results, { status: 200 });
    } catch (error) {
      return json({ error: "Failed to fetch documents" }, { status: 500 });
    }
  }

  async update(request: Request, cookies: Cookies): Promise<Response> {
    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();
      const { _id, ...updateData } = data;

      if (!_id) {
        return json({ error: "Missing _id field" }, { status: 400 });
      }

      const validatedData = this.validateData(updateData);
      if (!validatedData) {
        return json({ error: "Invalid data format" }, { status: 400 });
      }

      try {
        const existingDoc = await this.collection.findOne({
          _id: new ObjectId(_id),
          userId: user._id,
        });

        if (!existingDoc) {
          return json({ error: "Document not found" }, { status: 404 });
        }

        const updateDoc: Partial<WithAnyData<z.infer<T>>> = {
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
          { _id: new ObjectId(_id), userId: user._id },
          { $set: updateDoc },
          { returnDocument: "after" }
        );

        return json(result?.value || null, {
          status: result?.value ? 200 : 404,
        });
      } catch (error) {
        return json({ error: "Invalid ID format" }, { status: 400 });
      }
    } catch (error) {
      return json({ error: "Failed to update document" }, { status: 500 });
    }
  }

  async delete(request: Request, cookies: Cookies): Promise<Response> {
    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();

      if (!data._id) {
        return json({ error: "Missing _id field" }, { status: 400 });
      }

      try {
        const result = await this.collection.deleteOne({
          _id: new ObjectId(data._id),
          userId: user._id,
        });

        return json(
          { success: result.deletedCount > 0 },
          { status: result.deletedCount > 0 ? 200 : 404 }
        );
      } catch (error) {
        return json({ error: "Invalid ID format" }, { status: 400 });
      }
    } catch (error) {
      return json({ error: "Failed to delete document" }, { status: 500 });
    }
  }
}
