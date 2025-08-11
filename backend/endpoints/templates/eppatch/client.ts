// @ts-nocheck

import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_PATCH_ErrorCodes, type TNamexxx_PATCH_Body, type TNamexxx_PATCH_Response } from "./dto";


export async function clientRequestNamexxx_PATCH(body: TNamexxx_PATCH_Body): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_PATCH_Response, TNamexxx_PATCH_Body>({
        url: `/events/input/api`,
        method: "PATCH",
        body
    });

    if (error) {
        switch (error.errorCode) {
            case ENamexxx_GET_ErrorCodes.ID_NOT_FOUND:
                toastError("Event not found");
                break;
            default:
                toastError("An error occurred while processing the request.");
                break;
        }
        toastError(error.details);
        return null;
    }

    return data!.output;
}