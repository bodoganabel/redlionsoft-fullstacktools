import z from "zod/v4";
import type { TBodyEndpointHandler, TQueryEndpointHandler } from "./endpoint-generator.types";
import { EGeneralEndpontErrors, type TEndpointError } from "../../../common/backend-frontend/endpoints.types";
import type { TUserServerRls } from "../../auth/user.types";
import { isDebugMessageSendable } from "../../endpoints/utils";
import { devOnly } from "$redlionsoft/common/utilities/general";
import { logFocusedValidationErrors } from "../../../common/utilities/validation-error-formatter";

export async function executeQueryEndpoint<TQuerySchema extends z.ZodTypeAny, TUserServer, TResponseSchema extends z.ZodTypeAny>(parsedQuery: z.core.output<TQuerySchema>, handler: TQueryEndpointHandler<TQuerySchema, TResponseSchema, TUserServer>, request: Request, params: Partial<Record<string, string>>, url: URL, user: TUserServer | null, responseSchema: TResponseSchema, endpointOrigin: string): Promise<{ data: z.core.output<TResponseSchema> | null, endpointError: TEndpointError | null }> {

    const handlerResult = await handler({
        query: parsedQuery,
        request,
        params,
        url,
        user
    });

    // Check if handlerResult is instanceof TEndpointError
    if ((handlerResult as TEndpointError)?.errorCode !== undefined &&
        (handlerResult as TEndpointError)?.details !== undefined
    ) {
        return { data: null, endpointError: handlerResult as TEndpointError }
    }

    const parsedResponse = responseSchema.safeParse(handlerResult);

    if (!parsedResponse.success) {

        const parsedError = parsedResponse.error;

        devOnly(() => {
            console.log(`🔍 Query response validation failed for: ${endpointOrigin}`);
            logFocusedValidationErrors({ zodError: parsedError, originalInput: parsedQuery, origin: endpointOrigin });
        });

        const endpointError: TEndpointError = {
            details: isDebugMessageSendable(user as TUserServerRls<any, any, any>) ? parsedError.message : "",
            errorCode: EGeneralEndpontErrors.INVALID_RESPONSE,
            status: 400,
        }

        return { endpointError, data: null };
    }

    return { data: parsedResponse.data, endpointError: null }
}

export async function executeBodyEndpoint<TBodySchema extends z.ZodTypeAny, TUserServer, TResponseSchema extends z.ZodTypeAny>(parsedBody: z.core.output<TBodySchema>, handler: TBodyEndpointHandler<TBodySchema, TResponseSchema, TUserServer>, request: Request, params: Partial<Record<string, string>>, url: URL, user: TUserServer | null, responseSchema: TResponseSchema, endpointOrigin: string): Promise<{ data: z.core.output<TResponseSchema> | null, endpointError: TEndpointError | null }> {

    const handlerResult = await handler({
        body: parsedBody,
        request,
        params,
        url,
        user
    });

    // Check if handlerResult is instanceof TEndpointError
    if ((handlerResult as TEndpointError)?.errorCode !== undefined &&
        (handlerResult as TEndpointError)?.details !== undefined
    ) {
        return { data: null, endpointError: handlerResult as TEndpointError }
    }

    const parsedResponse = responseSchema.safeParse(handlerResult);

    if (!parsedResponse.success) {

        const parsedError = parsedResponse.error;

        devOnly(() => {
            console.log(`🔍 Body response validation failed for: ${endpointOrigin}`);
            logFocusedValidationErrors({ zodError: parsedError, originalInput: parsedBody, origin: endpointOrigin });
        });

        const endpointError: TEndpointError = {
            details: isDebugMessageSendable(user as TUserServerRls<any, any, any>) ? parsedError.message : "",
            errorCode: EGeneralEndpontErrors.INVALID_RESPONSE,
            status: 400,
        }

        return { endpointError, data: null };
    }

    return { data: parsedResponse.data, endpointError: null }
}
