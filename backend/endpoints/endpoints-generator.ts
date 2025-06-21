import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { z } from 'zod';
import { SEndpointError, type TEndpointError } from '../../common/backend-frontend/endpoints.types';

type TEndpointHandler<
    TQuerySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny
> = (query: z.infer<TQuerySchema>) => (Promise<z.infer<TResponseSchema> | TEndpointError>);


export function createGetHandler<
    TQuerySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny
>(
    querySchema: TQuerySchema,
    responseSchema: TResponseSchema,
    handler: TEndpointHandler<TQuerySchema, TResponseSchema>,
    status: number = 200,
): RequestHandler {
    return async ({ url }) => {

        try {

            const queryParams = Object.fromEntries(url.searchParams.entries());

            const parseResult = querySchema.safeParse(queryParams);

            if (!parseResult.success) {
                return json({ error: { message: 'Invalid query parameters', details: parseResult.error.format() } }, { status: 400 });
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
