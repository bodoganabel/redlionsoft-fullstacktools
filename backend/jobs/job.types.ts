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
    status: z.nativeEnum(EJobStatuses),
    retries: z.number(),
    retryCount: z.number(),
    //target: The actual function to be executed will be added in metadata
});

// Default metadata schema (for backward compatibility)
export const DefaultMetadataSchema = z.record(z.any());

/**
 * Creates a job schema with custom metadata schema
 * @template TMetadata The Zod schema type for metadata
 * @param metadataSchema The Zod schema for metadata validation
 * @returns A Zod schema for server jobs with the specified metadata schema
 */
export function createServerJobSchema<TMetadata extends z.ZodType>(
    metadataSchema: TMetadata
) {
    return ServerJobBaseSchema.extend({
        metadata: metadataSchema,
    });
}

// Type for a server job with strongly typed metadata
export type TServerJob<TMetadataType = Record<string, any>> =
    z.infer<typeof ServerJobBaseSchema> & {
        metadata: TMetadataType;
    };

/**
 * Type helper to extract the metadata type from a job schema
 * @template TSchema The Zod schema type
 */
export type ExtractJobMetadataType<TSchema extends z.ZodType> =
    z.infer<TSchema> extends { metadata: infer TMetadata } ? TMetadata : never;

// For backward compatibility
export const ServerJobSchema = createServerJobSchema(DefaultMetadataSchema);