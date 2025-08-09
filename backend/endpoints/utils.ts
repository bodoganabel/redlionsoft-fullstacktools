import { ECorePermissions, type TUserServerRls } from "./../auth/user.types";
import { isProduction } from "../../common";
import z from "zod/v4";

export function isDebugMessageSendable(user: TUserServerRls<any, any, any> | null): boolean {
    return (!isProduction() || ((user as any)?.permissions as (string[]))?.includes(ECorePermissions.DEBUG))
}

export function validate<T>(data: T, schema: z.ZodType<T>): { data: T | null, error: string | null } {
    const validated = schema.safeParse(data);
    if (!validated.success) {
        const error = z.treeifyError(validated.error);
        return { data: null, error: JSON.stringify(error, null, 2) };
    }
    return { data: validated.data, error: null };
}