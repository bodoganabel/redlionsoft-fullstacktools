import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_PATCH_ErrorCodes, type TNamexxx_PATCH_Body, type TNamexxx_PATCH_Response } from "./dto";
import { clientBase } from "$src/client.base";


export async function clientRequestNamexxx_PATCH(body: TNamexxx_PATCH_Body): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_PATCH_Response, TNamexxx_PATCH_Body>({
        url: clientBase.automaticApiUrl(import.meta.url),
        method: "PATCH",
        body
    });

    if (error) {
        return null;
    }

    return data!.output;
}