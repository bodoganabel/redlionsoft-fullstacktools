import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { EGeneralEndpontErrors, type TEndpointError } from '../../common/backend-frontend/endpoints.types';
import { ECorePermissions } from '../../backend/auth/user.types';
import type { AuthService } from './../auth/auth.service';
import type { TBodyEndpointHandler, TQueryEndpointHandler } from './components/endpoint-generator.types';
import type { TEndpointOptions } from './components/endpoint-generator.types';
import { handleAuth, parseBody, parseError, parseQuery } from './components/endpoint-generator-core';
import { executeBodyEndpoint, executeQueryEndpoint } from './components/endpoint-generator-executors';
import { DateTime } from 'luxon';


export class RedlionsoftEndpointGenerator<TUserServer, EPermissions
> {
    constructor(
        private authService: AuthService,
    ) { }
        
    RLS_QUERY_ENDPOINT<
        TQuerySchema extends z.ZodTypeAny,
        TResponseSchema extends z.ZodTypeAny
    >(
        endpointOrigin: string, //for identify the endpoint in the logs
        querySchema: TQuerySchema,
        responseSchema: TResponseSchema,
        options: TEndpointOptions<EPermissions>,
        handler: TQueryEndpointHandler<TQuerySchema, TResponseSchema, TUserServer>,
        status: number = 200,
    ): RequestHandler {
        return async ({ request, params, url, cookies }) => {

            try {
                const { user, error: authError } = await handleAuth<TUserServer, EPermissions>(this.authService, cookies, options);

                if (authError) {
                    return parseError(authError, options.responseHeaders);
                }

                const { parsedQuery, error: queryParsingError } = parseQuery<TQuerySchema>(url, querySchema, endpointOrigin);

                if (queryParsingError) {
                    return parseError(queryParsingError, options.responseHeaders)
                }

                const { data, endpointError } = await executeQueryEndpoint(parsedQuery!, handler, request, params, url, user, responseSchema, endpointOrigin )

                if (endpointError) {
                    return parseError(endpointError, options.responseHeaders)
                }

                return json(data, { status: status, headers: options.responseHeaders || undefined });

            } catch (error) {

                console.error(DateTime.utc().toISO(), error);
                const errorResponse: TEndpointError = {
                    details: 'Internal server error',
                    errorCode: EGeneralEndpontErrors.INTERNAL_SERVER_ERROR,
                };
                return parseError(errorResponse, options.responseHeaders);

                return json({
                    error: {
                        message: 'Internal server error',
                        details: JSON.stringify(error)
                    }
                }, { status: 500 });
            }
        };
    }

    RLS_BODY_ENDPOINT<
        TBodySchema extends z.ZodTypeAny,
        TResponseSchema extends z.ZodTypeAny
    >(
        endpointOrigin: string, //for identify the endpoint in the logs
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
                const { user, error: authError } = await handleAuth<TUserServer, EPermissions>(this.authService, cookies, options);

                if (authError) {
                    return parseError(authError, options.responseHeaders);
                }

                const { parsedBody, error: bodyParsingError } = await parseBody<TBodySchema>(request, bodySchema, endpointOrigin);

                if (bodyParsingError) {
                    return parseError(bodyParsingError, options.responseHeaders)
                }

                const { data, endpointError } = await executeBodyEndpoint(parsedBody!, handler, request, params, url, user, responseSchema, endpointOrigin)

                if (endpointError) {
                    return parseError(endpointError, options.responseHeaders)
                }

                return json(data, { status: status, headers: options.responseHeaders || undefined });

            } catch (error) {

                console.error(DateTime.utc().toISO(), error);
                const errorResponse: TEndpointError = {
                    details: 'Internal server error',
                    errorCode: EGeneralEndpontErrors.INTERNAL_SERVER_ERROR,
                };
                return parseError(errorResponse, options.responseHeaders);
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