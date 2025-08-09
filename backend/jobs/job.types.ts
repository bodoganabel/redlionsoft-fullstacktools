import { z } from "zod/v4";
import { ObjectId } from 'bson'

export enum EJobStatuses {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
};

export const JOB_RETRIES_ALLOWED_DEFAULT = 1;

// Base schema without metadata
export const ServerJobBaseSchema = z.object({
    _id: z.custom<ObjectId>(),
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
export const DefaultMetadataSchema = z.record(z.any(), z.any());

/**
 * Creates a job schema with custom metadata schema
 * @template TMetadata The metadata type that will be validated
 * @param metadataSchema The Zod schema for metadata validation
 * @returns A Zod schema for server jobs with the specified metadata schema
 */
export function createServerJobSchema<TMetadata>(
    metadataSchema: z.ZodType<TMetadata>
): z.ZodType<TServerJob<TMetadata>> {
    return ServerJobBaseSchema.extend({
        metadata: metadataSchema,
    }) as z.ZodType<TServerJob<TMetadata>>;
}

// Type for a server job with strongly typed metadata
export type TServerJob<TMetadataType = Record<string, any>> =
    z.infer<typeof ServerJobBaseSchema> & {
        metadata: TMetadataType;
    };

// For backward compatibility
export const ServerJobSchema = createServerJobSchema(DefaultMetadataSchema);