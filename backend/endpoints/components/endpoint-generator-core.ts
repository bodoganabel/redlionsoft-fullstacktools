import { json, type Cookies } from "@sveltejs/kit";
import type { AuthService } from "../../auth/auth.service";
import type { TUserServerRls } from "../../auth/user.types";
import type { TEndpointOptions } from "./endpoint-generator.types";
import { EGeneralEndpontErrors, type TEndpointError } from "../../../common/backend-frontend/endpoints.types";
import { devOnly } from "$redlionsoft/common/utilities/general";
import { logFocusedValidationErrors } from "../../../common/utilities/validation-error-formatter";
import z from "zod/v4";

export async function handleAuth<TUserServer, EPermissions>(authService: AuthService, cookies: Cookies, options: TEndpointOptions<EPermissions>): Promise<{ error: TEndpointError | null, user: TUserServer | null }> {

    const user = await authService.getServerUserFromCookies(cookies) as TUserServer | null;

    if (options.requireAuthentication && !user) {
        const error: TEndpointError = {
            details: 'Unauthorized',
            errorCode: EGeneralEndpontErrors.UNAUTHORIZED,
            status: 401
        }
        return { user: null, error };
    }

    if (options.requirePermissions && options.requirePermissions.length > 0 && user !== null) {
        const hasPermissions = await authService.hasPermissions(
            user as TUserServerRls<any, any, any>, options.requirePermissions);

        if (!hasPermissions) {
            const error: TEndpointError = {
                details: 'Permission denied',
                errorCode: EGeneralEndpontErrors.PERMISSION_DENIED,
                status: 401
            }
            return { user, error }
        }
    }

    return { user, error: null }

}

export function parseError(error: TEndpointError): Response {
    return json({
        error: { ...error, status: undefined }
    }, { status: error.status || 400 })
}

export function parseQuery<TQuerySchema extends z.ZodTypeAny>(url: URL, querySchema: TQuerySchema, endpointOrigin: string): { parsedQuery: z.infer<TQuerySchema> | null, error: TEndpointError | null } {
    const searchParamsEntries = Array.from(url.searchParams.entries());
    const queryParams = searchParamsEntries.length > 0 ? Object.fromEntries(searchParamsEntries) : undefined;


    const safeParseResult = querySchema.safeParse(queryParams);

    if (!safeParseResult.success) {
        const parsedError = safeParseResult.error;

        devOnly(() => {
            console.log(`🔍 Query validation failed for: ${endpointOrigin}`);
            logFocusedValidationErrors({zodError:parsedError, originalInput:queryParams, origin:endpointOrigin});
        });

        const error: TEndpointError = {
            details: 'Invalid Query',
            errorCode: EGeneralEndpontErrors.INVALID_QUERY,
            status: 400,
            toastError: EGeneralEndpontErrors.INVALID_QUERY
        }

        return { error, parsedQuery: null }
    }
    return { parsedQuery: safeParseResult.data, error: null }
}
export async function parseBody<TBodySchema extends z.ZodTypeAny>(request: Request, bodySchema: TBodySchema, endpointOrigin: string): Promise<{ parsedBody: z.infer<TBodySchema> | null, error: TEndpointError | null }> {

    const body = request.body ? await request.json() : undefined;

    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
        const parsedError = parseResult.error;

        devOnly(() => {
            console.log(`🔍 Body validation failed for: ${endpointOrigin}`);
            logFocusedValidationErrors({zodError:parsedError, originalInput:body, origin: endpointOrigin});
        });

        const error: TEndpointError = {
            details: 'Invalid Body',
            errorCode: EGeneralEndpontErrors.INVALID_BODY,
            status: 400,
            toastError: EGeneralEndpontErrors.INVALID_BODY
        }

        return { error, parsedBody: null }
    }
    return { parsedBody: parseResult.data, error: null }
}