import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { z } from 'zod';
import { SEndpointError, type TEndpointError } from '../../common/backend-frontend/endpoints.types';
import { type TUserServerRls } from '../../backend/auth/user.types';
import type { AuthService } from 'auth/auth.service';

type THandlerParams<
    TQuerySchema extends z.ZodTypeAny,
    TUserServer,
> = {
    query: z.infer<TQuerySchema>, request: Request,
    params: Partial<Record<string, string>>,
    url: URL,
    user: TUserServer | null
}

type THandlerReturns<
    TResponseSchema extends z.ZodTypeAny,
> = z.infer<TResponseSchema> | TEndpointError;

type TEndpointHandler<
    TQuerySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
    TUserServer
> = (handlerParams: THandlerParams<TQuerySchema, TUserServer>) => (Promise<THandlerReturns<TResponseSchema>>);


export class RedlionsoftEndpointGenerator<TUserServer,
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
        handler: TEndpointHandler<TQuerySchema, TResponseSchema, TUserServer>,
        status: number = 200,
    ): RequestHandler {
        return async ({ request, params, url, cookies }) => {

            try {

                const queryParams = Object.fromEntries(url.searchParams.entries());

                const parseResult = querySchema.safeParse(queryParams);

                if (!parseResult.success) {
                    return json({ error: { message: 'Invalid query parameters', details: parseResult.error.flatten() } }, { status: 400 });
                }

                const user = await this.authService.getServerUserFromCookies(cookies) as TUserServer | null;

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