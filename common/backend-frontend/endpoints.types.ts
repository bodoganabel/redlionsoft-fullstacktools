import { z } from "zod/v4";


export const SEndpointError = z.object({
    errorCode: z.string(),
    details: z.string(),
    status: z.number().optional(),
    toastError: z.string().optional()
});

export type TEndpointError = z.infer<typeof SEndpointError>;



// Types
export type ApiResponse<TData> = {
    data: TData | null;
    error: TEndpointError | null;
    status: number | null;
    toastSuccess?: string;
};

export type ApiRequestConfig<TInputData = unknown> = {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: TInputData;
    query?: TInputData;
    headers?: HeadersInit;
    credentials?: RequestCredentials;
    querySchema?: z.ZodTypeAny;
    bodySchema?: z.ZodTypeAny;
};

export type ApiRequestOptions = {
    errorMessages?: Record<string, string>;
    defaultErrorMessage?: string;
};

export enum EGeneralEndpontErrors {
    UNAUTHORIZED = "UNAUTHORIZED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    INVALID_QUERY = "INVALID_QUERY",
    INVALID_BODY = "INVALID_BODY",
    INVALID_RESPONSE = "INVALID_RESPONSE",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}