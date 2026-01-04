import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_DELETE_ErrorCodes, type TNamexxx_DELETE_Body, type TNamexxx_DELETE_Response } from "./dto";
import { clientBase } from "$src/client.base";


export async function clientRequestNamexxx_DELETE(body: TNamexxx_DELETE_Body): Promise<TNamexxx_DELETE_Response | null> {

    const { data, error } = await apiRequest<TNamexxx_DELETE_Response, TNamexxx_DELETE_Body>({
        url: clientBase.automaticApiUrl(import.meta.url),
        method: "DELETE",
        body
    });

    if (error) {
        return null;
    }

    return data!.outDELETE;
}