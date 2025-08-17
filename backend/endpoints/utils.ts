import { ECorePermissions, type TUserServerRls } from "./../auth/user.types";
import { isProduction } from "../../common";
import { extractFocusedValidationErrors } from "../../common/utilities/validation-error-formatter";
import z from "zod/v4";

export function isDebugMessageSendable(user: TUserServerRls<any, any, any> | null): boolean {
    return (!isProduction() || ((user as any)?.permissions as (string[]))?.includes(ECorePermissions.DEBUG))
}

export function validate<T>(data: T, schema: z.ZodType<T>): { data: T | null, error: string | null } {
    const validated = schema.safeParse(data);
    if (!validated.success) {
        const treeifiedError = validated.error.format();
        const focusedErrors = extractFocusedValidationErrors(treeifiedError, data);
        const errorMessage = focusedErrors.map(err => 
            `${err.path}: expected ${err.expectedType}, got ${typeof err.actualValue === 'string' ? `"${err.actualValue}"` : err.actualValue}`
        ).join('; ');
        return { data: null, error: errorMessage };
    }
    return { data: validated.data, error: null };
}