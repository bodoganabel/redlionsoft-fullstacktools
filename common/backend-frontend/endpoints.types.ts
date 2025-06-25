import { z } from "zod/v4";

export const SEndpointError = z.object({
    errorCode: z.string(),
    details: z.string().optional(),
    status: z.number().optional()
});

export type TEndpointError = z.infer<typeof SEndpointError>;
