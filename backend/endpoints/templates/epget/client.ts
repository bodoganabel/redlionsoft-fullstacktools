import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_GET_ErrorCodes, type TNamexxx_GET_Query, type TNamexxx_GET_Response } from "./dto";
import { clientBase } from "$src/client.base";


export async function clientRequestNamexxx_GET(query: TNamexxx_GET_Query): Promise<TNamexxx_GET_Response | null> {

    const { data, error } = await apiRequest<TNamexxx_GET_Response, TNamexxx_GET_Query>({
        url: clientBase.automaticApiUrl(import.meta.url),
        method: "GET",
        query
    });

    if (error) {
        return null;
    }

    return data!.output;
}