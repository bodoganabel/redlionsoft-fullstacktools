// @ts-nocheck


import { ENamexxx_GET_ErrorCodes, type TNamexxx_GET_Query, type TNamexxx_GET_Response } from "./dto";


export async function clientRequestNamexxx_GET(query: TNamexxx_GET_Query): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_GET_Response, TNamexxx_GET_Query>({
        url: `/events/input/api`,
        method: "GET",
        query
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