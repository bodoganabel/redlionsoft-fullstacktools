import { z } from "zod";

export enum EJobStatuses {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
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
    retriesHappened: z.number(),
    retriesAllowed: z.number(),
    results: z.array(z.object({
        message: z.string(),
        dateIso: z.string(),
    })).optional(),
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

// For backward compatibility
export const ServerJobSchema = createServerJobSchema(DefaultMetadataSchema);