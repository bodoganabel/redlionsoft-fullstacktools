import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_POST_ErrorCodes, type TNamexxx_POST_Body, type TNamexxx_POST_Response } from "./dto";
import { clientBase } from "$src/client.base";


export async function clientRequestNamexxx_POST(body: TNamexxx_POST_Body): Promise<TNamexxx_POST_Response | null> {

    const { data, error } = await apiRequest<TNamexxx_POST_Response, TNamexxx_POST_Body>({
        url: clientBase.automaticApiUrl(import.meta.url),
        method: "POST",
        body
    });

    if (error) {
        return null;
    }

    return data!.output;
}