import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_GET_ErrorCodes, type TNamexxx_GET_Query, type TNamexxx_GET_Response } from "./dto";


export async function clientRequestNamexxx_GET(query: TNamexxx_GET_Query): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_GET_Response, TNamexxx_GET_Query>({
        url: `/events/input/api`,
        method: "GET",
        query
    });

    if (error) {
        return null;
    }

    return data!.output;
}