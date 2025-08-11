import z from "zod/v4";
import type { TBodyEndpointHandler, TQueryEndpointHandler } from "./endpoint-generator.types";
import { EGeneralEndpontErrors, type TEndpointError } from "../../../common/backend-frontend/endpoints.types";
import type { TUserServerRls } from "auth/user.types";
import { isDebugMessageSendable } from "../../endpoints/utils";

export async function executeQueryEndpoint<TQuerySchema extends z.ZodTypeAny, TUserServer, TResponseSchema extends z.ZodTypeAny>(parsedQuery: z.core.output<TQuerySchema>, handler: TQueryEndpointHandler<TQuerySchema, TResponseSchema, TUserServer>, request: Request, params: Partial<Record<string, string>>, url: URL, user: TUserServer | null, responseSchema: TResponseSchema, endpointOrigin: string): Promise<{data: z.core.output<TResponseSchema> | null, endpointError: TEndpointError | null}> {
    
    const data = await handler({
        query: parsedQuery,
        request,
        params,
        url,
        user
    });

    const parsedResponse = responseSchema.safeParse(data);

    if (!parsedResponse.success) {

        const parsedError = parsedResponse.error;
        const treeifiedError = z.treeifyError(parsedError);

        console.log(`from Query request: ${endpointOrigin}`)
        console.log(`treeifiedError at ${import.meta.url}, line 24`);
        console.log(JSON.stringify(treeifiedError, null, 2));

        const endpointError: TEndpointError = {
            details: isDebugMessageSendable(user as TUserServerRls<any, any, any>) ? JSON.stringify(treeifiedError, null, 2) : "",
            errorCode: EGeneralEndpontErrors.INVALID_RESPONSE,
            status: 400,
            toastError: EGeneralEndpontErrors.INVALID_RESPONSE
        }

        return { endpointError, data: null };
    }
    
    return { data: parsedResponse.data, endpointError: null }
}

export async function executeBodyEndpoint<TBodySchema extends z.ZodTypeAny, TUserServer, TResponseSchema extends z.ZodTypeAny>(parsedBody: z.core.output<TBodySchema>, handler: TBodyEndpointHandler<TBodySchema, TResponseSchema, TUserServer>, request: Request, params: Partial<Record<string, string>>, url: URL, user: TUserServer | null, responseSchema: TResponseSchema, endpointOrigin: string): Promise<{data: z.core.output<TResponseSchema> | null, endpointError: TEndpointError | null}> {
    
    const data = await handler({
        body: parsedBody,
        request,
        params,
        url,
        user
    });

    const parsedResponse = responseSchema.safeParse(data);

    if (!parsedResponse.success) {

        const parsedError = parsedResponse.error;
        const treeifiedError = z.treeifyError(parsedError);

        console.log(`from Body request: ${endpointOrigin}`)
        console.log(`treeifiedError  at ${import.meta.url}, line 57`);
        console.log(JSON.stringify(treeifiedError, null, 2));

        const endpointError: TEndpointError = {
            details: isDebugMessageSendable(user as TUserServerRls<any, any, any>) ? JSON.stringify(treeifiedError, null, 2) : "",
            errorCode: EGeneralEndpontErrors.INVALID_RESPONSE,
            status: 400,
            toastError: EGeneralEndpontErrors.INVALID_RESPONSE
        }

        return { endpointError, data: null };
    }
    
    return { data: parsedResponse.data, endpointError: null }
}
