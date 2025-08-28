import type z from "zod/v4"
import type { TEndpointError } from "../../../common/backend-frontend/endpoints.types"
import type { ECorePermissions } from "auth/user.types"

export type THandlerParamsBase<
    TUserServer,
> = {
    request: Request,
    params: Partial<Record<string, string>>,
    url: URL,
    user: TUserServer | null
}

export type TQueryHandlerParams<TQuerySchema extends z.ZodTypeAny, TUserServer> = THandlerParamsBase<TUserServer> &
{
    query: z.infer<TQuerySchema>
}

export type TBodyHandlerParams<TBodySchema extends z.ZodTypeAny, TUserServer> = THandlerParamsBase<TUserServer> &
{
    body: z.infer<TBodySchema>
}


export type THandlerReturns<
    TResponseSchema extends z.ZodTypeAny,
> = z.infer<TResponseSchema>;

export type TQueryEndpointHandler<
    TQuerySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
    TUserServer
> = (handlerParams: TQueryHandlerParams<TQuerySchema, TUserServer>) => (Promise<THandlerReturns<TResponseSchema> | TEndpointError>);

export type TBodyEndpointHandler<
    TBodySchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
    TUserServer
> = (handlerParams: TBodyHandlerParams<TBodySchema, TUserServer>) => (Promise<THandlerReturns<TResponseSchema> | TEndpointError>);


export type TEndpointOptions<EPermissions> = {
    requireAuthentication?: boolean,
    requirePermissions?: (EPermissions | ECorePermissions)[],
    responseHeaders?: Record<string, string>,
}