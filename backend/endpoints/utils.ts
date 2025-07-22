import { ECorePermissions, type TUserServerRls } from "./../auth/user.types";
import { isProduction } from "../../common";

export function isDebugMessageSendable(user: TUserServerRls<any, any, any> | null): boolean {
    return (!isProduction() || ((user as any)?.permissions as (string[]))?.includes(ECorePermissions.DEBUG))
}