import { Collection, ObjectId } from "mongodb";
import { z } from "zod/v4";
import type {
  BaseDocument,
  ChangeHistoryEntry,
  UserCrudServiceOptions,
  WithAnyData,
} from "./types";
import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import type { Cookies } from "@sveltejs/kit";
import { devOnly } from "../../common/utilities/general";

export class UserCrudService {
  protected collection: Collection;
  private isStoreChangeHistory?: boolean;
  private dataSchema: z.ZodSchema;
  private authService: AuthService<any, any, any, any>;

  constructor(
    collection: Collection,
    authService: AuthService<any, any, any, any>,
    options: {
      dataSchema: z.ZodSchema;
      isStoreChangeHistory?: boolean;
    }
  ) {
    this.collection = collection;
    this.authService = authService;
    this.dataSchema = options.dataSchema;
    this.isStoreChangeHistory = options.isStoreChangeHistory;
  }

  private validateData(data: unknown): z.infer<typeof this.dataSchema> | string | null {
    try {
      devOnly(() => {
        console.log("Validating data:", data);
      });

      const validated = this.dataSchema.parse(data);
      devOnly(() => {
        console.log("Validation passed:", validated);
      });

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Human-readable error summary
        console.log('Zod validation errors:');
        console.log(error.format().errors.map((e:any) => `Field '${e.path.join('.') || '(root)'}': ${e.message}`).join('; '))
        console.error(error.format());
        return null;
      }
      return null;
    }
  }

  private createChangeHistoryEntry(
    previousData: Record<string, any>,
    newData: Record<string, any> | any
  ): ChangeHistoryEntry {
    return {
      timestamp: new Date().toISOString(),
      previousData,
      newData,
    };
  }

  async create(request: Request, cookies: Cookies): Promise<Response> {
    console.log("UCRUD create");

    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const requestData = await request.json();
      const { resourceId, data } = requestData as {
        resourceId: string;
        data: unknown;
      };

      if (!resourceId?.trim()) {
        return json(
          {
            error: "Resource ID cannot be empty",
          },
          { status: 400 }
        );
      }

      const validatedData = this.validateData(data);
      if (!validatedData) {
        return json(
          {
            error:
              "Invalid data format. Please check the data schema requirements.",
          },
          { status: 400 }
        );
      }

      // Get the highest order value
      const highestOrder = await this.collection
        .find({ userId: user._id })
        .sort({ order: -1 })
        .limit(1)
        .toArray()
        .then((docs) => (docs.length > 0 ? docs[0]?.order || 0 : 0));

      const document: WithAnyData<z.infer<typeof this.dataSchema>> = {
        userId: user._id,
        resourceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: validatedData,
        changeHistory: [],
        order: highestOrder + 1, // Set order to highest + 1
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
        .sort({ order: -1 }) // Sort by order descending (smallest last)
        .toArray();
      return json(results, { status: 200 });
    } catch (error) {
      return json({ error: "Failed to fetch documents" }, { status: 500 });
    }
  }

  async update(request: Request, cookies: Cookies): Promise<Response> {
    console.log("UCRUD update");

    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();

      if (!data.resourceId?.trim()) {
        return json({ error: "Resource ID cannot be empty" }, { status: 400 });
      }

      const validatedData = this.validateData(data.data);

      if (validatedData === null) {
        return json({ error: "Invalid data format" }, { status: 400 });
      }

      try {
        const query = { resourceId: data.resourceId, userId: user._id };
        const existingDoc = await this.collection.findOne(query);

        const updateDoc: Partial<WithAnyData<z.infer<typeof this.dataSchema>>> =
        {
          data: validatedData,
          updatedAt: new Date().toISOString(),
        };

        // Always preserve the existing order unless the client provides a new one
        console.log('data.order, existingDoc.order:');
        console.log(data.order, existingDoc?.order);
        if (data.order !== undefined) {
          updateDoc.order = data.order;
        } else if (existingDoc?.order !== undefined) {
          updateDoc.order = existingDoc.order;
        }

        if (this.isStoreChangeHistory && existingDoc) {
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
          query,
          {
            $set: existingDoc
              ? updateDoc
              : {
                ...updateDoc,
                userId: user._id,
                resourceId: data.resourceId,
                createdAt: new Date().toISOString(),
                changeHistory: [],
              },
          },
          { returnDocument: "after", upsert: true }
        );

        return json(result, {
          status: result ? 200 : 404,
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

      console.log("data:");
      console.log(data);

      if (!data.resourceId?.trim()) {
        return json({ error: "Resource ID cannot be empty" }, { status: 400 });
      }

      try {
        const result = await this.collection.findOneAndDelete({
          resourceId: data.resourceId,
          userId: user._id,
        });

        if (result?.deletedCount === 0) {
          return json({ error: "Document not found" }, { status: 404 });
        }

        return json({ ok: true }, { status: 200 });
      } catch (error) {
        return json({ error: "Invalid ID format" }, { status: 400 });
      }
    } catch (error) {
      return json({ error: "Failed to delete document" }, { status: 500 });
    }
  }

  // New method to handle reordering of resources
  async updateOrder(request: Request, cookies: Cookies): Promise<Response> {
    try {
      const user = await this.authService.getServerUserFromCookies(cookies);
      if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      const { items } = (await request.json()) as {
        items: { resourceId: string; order: number }[];
      };

      if (!Array.isArray(items)) {
        return json({ error: "Invalid items format" }, { status: 400 });
      }

      const operations = items.map(({ resourceId, order }) => ({
        updateOne: {
          filter: { resourceId, userId: user._id },
          update: { $set: { order } },
        },
      }));

      await this.collection.bulkWrite(operations);

      return json({ success: true }, { status: 200 });
    } catch (error) {
      return json({ error: "Failed to update order" }, { status: 500 });
    }
  }
}
