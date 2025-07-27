import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { EGeneralEndpontErrors, type TEndpointError } from '../../common/backend-frontend/endpoints.types';
import { type TUserServerRls } from '../../backend/auth/user.types';
import { isProduction } from '../../common';
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
                    return parseError(authError);
                }

                const { parsedQuery, error: queryParsingError } = parseQuery<TQuerySchema>(url, querySchema);

                if (queryParsingError) {
                    return parseError(queryParsingError)
                }

                const { data, endpointError } = await executeQueryEndpoint(parsedQuery!, handler, request, params, url, user, responseSchema)

                if (endpointError) {
                    return parseError(endpointError)
                }

                return json(data, { status: status, headers: options.responseHeaders || undefined });

            } catch (error) {

                console.error(DateTime.now().setZone('UTC').toISO(), error);
                const errorResponse: TEndpointError = {
                    details: 'Internal server error',
                    errorCode: EGeneralEndpontErrors.INTERNAL_SERVER_ERROR,
                };
                return parseError(errorResponse);

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
                    return parseError(authError);
                }

                const { parsedBody, error: bodyParsingError } = await parseBody<TBodySchema>(request, bodySchema);

                if (bodyParsingError) {
                    return parseError(bodyParsingError)
                }

                const { data, endpointError } = await executeBodyEndpoint(parsedBody!, handler, request, params, url, user, responseSchema)

                if (endpointError) {
                    return parseError(endpointError)
                }

                return json(data, { status: status, headers: options.responseHeaders || undefined });

            } catch (error) {

                console.error(DateTime.now().setZone('UTC').toISO(), error);
                const errorResponse: TEndpointError = {
                    details: 'Internal server error',
                    errorCode: EGeneralEndpontErrors.INTERNAL_SERVER_ERROR,
                };
                return parseError(errorResponse);
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