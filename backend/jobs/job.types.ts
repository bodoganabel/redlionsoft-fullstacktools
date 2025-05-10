import { z } from "zod";

export enum EJobStatuses {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELED = "CANCELED"
};


// Base schema without metadata
export const ServerJobBaseSchema = z.object({
    _id: z.string().optional(),
    userId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.string().optional(),
    targetDateIso: z.string(),
    targetFunction: z.function(),
    targetFunctionArgs: z.array(z.any()),
    status: z.nativeEnum(EJobStatuses),
    retries: z.number(),
    retryCount: z.number(),
});

// Default metadata schema (for backward compatibility)
export const DefaultMetadataSchema = z.any();

// Function to create a job schema with custom metadata schema
export function createServerJobSchema<T extends z.ZodType = typeof DefaultMetadataSchema>(
    metadataSchema: T = DefaultMetadataSchema as unknown as T
) {
    return ServerJobBaseSchema.extend({
        metadata: metadataSchema,
    });
}

// Default ServerJobSchema for backward compatibility
export const ServerJobSchema = createServerJobSchema();

// Type for a server job with default metadata
export type TServerJob = z.infer<typeof ServerJobSchema>;

// Type for a server job with custom metadata
export type TServerJobWithMetadata<T> = Omit<z.infer<typeof ServerJobBaseSchema>, 'metadata'> & {
    metadata: T;
};