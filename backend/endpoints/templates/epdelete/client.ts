// @ts-nocheck


import { ENamexxx_DELETE_ErrorCodes, type TNamexxx_DELETE_Body, type TNamexxx_DELETE_Response } from "./dto";


export async function clientRequestNamexxx_DELETE(body: TNamexxx_DELETE_Body): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_DELETE_Response, TNamexxx_DELETE_Body>({
        url: `/events/inDELETE/api`,
        method: "DELETE",
        body
    });

    if (error) {
        switch (error.errorCode) {
            case ENamexxx_DELETE_ErrorCodes.ID_NOT_FOUND:
                toastError("Event not found");
                break;
            default:
                toastError("An error occurred while processing the request.");
                break;
        }
        toastError(error.details);
        return null;
    }

    return data!.outDELETE;
}