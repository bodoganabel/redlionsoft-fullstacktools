import { json, type RequestHandler } from '@sveltejs/kit';
import type { ZodFlattenedError, z } from 'zod/v4';
import { type TEndpointError } from '../../common/backend-frontend/endpoints.types';
import { type TUserServerRls } from '../../backend/auth/user.types';
import { isProduction } from '../../common';
import { ECorePermissions } from '../../backend/auth/user.types';
import type { AuthService } from './../auth/auth.service';

type THandlerParamsBase<
TUserServer,
> = {
    request: Request,
        params: Partial<Record<string, string>>,
            url: URL,
                user: TUserServer | null
}

type TQueryHandlerParams<TQuerySchema extends z.ZodTypeAny, TUserServer> = THandlerParamsBase<TUserServer> &
{
    query: z.infer<TQuerySchema> 
}

type TBodyHandlerParams<TBodySchema extends z.ZodTypeAny, TUserServer> = THandlerParamsBase<TUserServer> &
{
    body: z.infer<TBodySchema> 
}


type THandlerReturns<
    TResponseSchema extends z.ZodTypeAny,
> = z.infer<TResponseSchema> | TEndpointError;

type TQueryEndpointHandler<
    TQuerySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
    TUserServer
> = (handlerParams: TQueryHandlerParams<TQuerySchema, TUserServer>) => (Promise<THandlerReturns<TResponseSchema>>);

type TBodyEndpointHandler<
    TBodySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
    TUserServer
> = (handlerParams: TBodyHandlerParams<TBodySchema, TUserServer>) => (Promise<THandlerReturns<TResponseSchema>>);


export class RedlionsoftEndpointGenerator<TUserServer, EPermissions
> {
    constructor(
        private authService: AuthService,
    ) { }

    RLS_GET<
        TQuerySchema extends z.ZodTypeAny,
        TResponseSchema extends z.ZodTypeAny
    >(
        querySchema: TQuerySchema,
        responseSchema: TResponseSchema,
        options: {
            requireAuthentication?: boolean,
            requirePermissions?: (EPermissions | ECorePermissions)[],
            responseHeaders?: Record<string, string>,
        },
        handler: TQueryEndpointHandler<TQuerySchema, TResponseSchema, TUserServer>,
        status: number = 200,
    ): RequestHandler {
        return async ({ request, params, url, cookies }) => {

            try {

                const searchParamsEntries = Array.from(url.searchParams.entries());
                const queryParams = searchParamsEntries.length > 0 ? Object.fromEntries(searchParamsEntries) : undefined;

                const user = await this.authService.getServerUserFromCookies(cookies) as TUserServer | null;

                if (options.requireAuthentication && !user) {
                    return json({ error: { message: 'Unauthorized' } }, { status: 401 });
                }

                if (options.requirePermissions && options.requirePermissions.length > 0 && user !== null) {
                    const hasPermissions = await this.authService.hasPermissions(
                        user as TUserServerRls<any, any, any>, options.requirePermissions);

                    if (!hasPermissions) {
                        return json({ error: { message: 'Permission denied', } }, { status: 401 });
                    }
                }

                const parseResult = querySchema.safeParse(queryParams);

                if (!parseResult.success) {

                    let details: ZodFlattenedError<any, string> | undefined = undefined;

                    if (!isProduction() || ((user as any)?.permissions as (string[]))?.includes(ECorePermissions.DEBUG)) {
                        details = parseResult.error.flatten();
                    }

                    return json({ error: { message: 'Invalid request', details } }, { status: 400 });
                }



                const data = await handler({
                    query: parseResult.data,
                    request,
                    params,
                    url,
                    user
                });
                // Type guard: Check if the returned data is an error object
                if (data && typeof data === 'object' && 'errorCode' in data) {
                    // If it's an error, return it with appropriate status code
                    return json(data, { status: data.status || 400 });
                }

                const parsedResponse = responseSchema.parse(data);

                return json(parsedResponse, { status: status, headers: options.responseHeaders || undefined});

            } catch (error) {
                return json({
                    error: {
                        message: 'Internal server error',
                        details: JSON.stringify(error)
                    }
                }, { status: 500 });
            }
        };
    }
    
    RLS_POST<
        TBodySchema extends z.ZodTypeAny,
        TResponseSchema extends z.ZodTypeAny
    >(
        bodySchema: TBodySchema,
        responseSchema: TResponseSchema,
        options: {
            requireAuthentication?: boolean,
            requirePermissions?: (EPermissions | ECorePermissions)[],
            responseHeaders?: Record<string, string>,
        },
        handler: TBodyEndpointHandler<TBodySchema, TResponseSchema, TUserServer>,
        status: number = 200,
    ): RequestHandler {
        return async ({ request, params, url, cookies }) => {

            try {

                const bodyParams = await request.json();

                const user = await this.authService.getServerUserFromCookies(cookies) as TUserServer | null;

                if (options.requireAuthentication && !user) {
                    return json({ error: { message: 'Unauthorized' } }, { status: 401 });
                }

                if (options.requirePermissions && options.requirePermissions.length > 0 && user !== null) {
                    const hasPermissions = await this.authService.hasPermissions(
                        user as TUserServerRls<any, any, any>, options.requirePermissions);

                    if (!hasPermissions) {
                        return json({ error: { message: 'Permission denied', } }, { status: 401 });
                    }
                }

                const parseResult = bodySchema.safeParse(bodyParams);

                if (!parseResult.success) {

                    let details: ZodFlattenedError<any, string> | undefined = undefined;

                    if (!isProduction() || ((user as any)?.permissions as (string[]))?.includes(ECorePermissions.DEBUG)) {
                        details = parseResult.error.flatten();
                    }

                    return json({ error: { message: 'Invalid request', details } }, { status: 400 });
                }



                const data = await handler({
                    body: parseResult.data,
                    request,
                    params,
                    url,
                    user
                });
                // Type guard: Check if the returned data is an error object
                if (data && typeof data === 'object' && 'errorCode' in data) {
                    // If it's an error, return it with appropriate status code
                    return json(data, { status: data.status || 400 });
                }

                const parsedResponse = responseSchema.parse(data);

                return json(parsedResponse, { status: status, headers: options.responseHeaders || undefined});

            } catch (error) {
                return json({
                    error: {
                        message: 'Internal server error',
                        details: JSON.stringify(error)
                    }
                }, { status: 500 });
            }
        };
    }

}

/* 

export function RLS_POST<
    SBodySchema extends z.ZodTypeAny,
    SResponseSchema extends z.ZodTypeAny
>(
    bodySchema: SBodySchema,
    responseSchema: SResponseSchema,
    handler: TEndpointHandler<SBodySchema, SResponseSchema>,
    status: number = 200,
): RequestHandler {
    return async ({ request }) => {

        try {

            const body = await request.json();

            const parseResult = bodySchema.safeParse(body);

            if (!parseResult.success) {
                return json({ error: { message: 'Invalid body parameters', details: parseResult.error.format() } }, { status: 400 });
            }


            const data = await handler(parseResult.data);
            // Type guard: Check if the returned data is an error object
            if (data && typeof data === 'object' && 'errorCode' in data) {
                // If it's an error, return it with appropriate status code
                return json(data, { status: data.status || 400 });
            }

            const parsedResponse = responseSchema.parse(data);

            return json(parsedResponse, { status: status });

        } catch (error) {
            return json({
                error: {
                    message: 'Internal server error',
                    details: JSON.stringify(error)
                }
            }, { status: 500 });
        }
    };
}
 */