import { json, type Cookies, type ParamMatcher, type RequestHandler } from "@sveltejs/kit";
import { AuthService } from "auth/auth.service";
import type { TUserServerRls } from "auth/user.types";
import JWT from "jwt";
import { Collection } from "mongodb";
import { authService } from "../../../backend.base";
import { z } from "zod";
import { error } from "console";


const SErrorResponse = z.object({
    message: z.string(),
    code: z.string(),
    details: z.any().optional(),
});

type TErrorResponse = z.infer<typeof SErrorResponse>;


export type TRequestProcessor<TSuccessData, TQuerySchema> = (requestParams: {
    cookies: Cookies,
    params: any,
    validatedQuery: TQuerySchema | undefined
    user: TUserServerRls<any, any, any> | null
}) => Promise<({
    error: TErrorResponse, status?: number
} | { data: TSuccessData, status?: number })>

export class RedlionsoftEndpointGenerator {
    constructor(private authService: AuthService) {


    }

    GET<TSuccessData, TQuerySchema = undefined>(
        requestProcessor: TRequestProcessor<TSuccessData, TQuerySchema>,
        options: {
            authRequired?: boolean,
            permissions?: string[],
            querySchema?: z.ZodType<TQuerySchema>,
        } = { authRequired: false, permissions: [], querySchema: undefined }) {
        const GET: RequestHandler = async ({ cookies, params, request, url }) => {
            const query = url.searchParams;
            const user = (await this.authService.getServerUserFromCookies(cookies)) as TUserServerRls<any, any, any> | null;
            if (options?.authRequired) {
                if (user === null) {
                    return json({ error: { message: "User is not authenticated", code: "AUTH_REQUIRED" } }, { status: 401 });
                }
                if (options.permissions !== undefined && !(await this.authService.hasPermissions(user, options.permissions))) {
                    return json({ error: { message: "Insufficient permissions", code: "PERMISSION_DENIED" } }, { status: 403 });
                }
            }

            const validatedQuery = options.querySchema ? options.querySchema.parse(query) : undefined;

            const result = await requestProcessor({ cookies, params, validatedQuery, user });

            const status = result.status;
            let finalData: any;

            if ('data' in result) {
                finalData = result.data;
            } else if ('error' in result) {
                finalData = result.error;
            }

            return json({ ...finalData }, { status: status });
        }
        return GET;
    }

}


const SExpectedInput = z.object({
    selectedEntries: z.array(z.string()),
});

type TExpectedInput = z.infer<typeof SExpectedInput>;

const SExpectedOutput = z.object({
    success: z.boolean(),
});

type TExpectedOutput = z.infer<typeof SExpectedOutput>
