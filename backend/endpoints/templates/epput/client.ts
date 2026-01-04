// @ts-nocheck

import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_PUT_ErrorCodes, type TNamexxx_PUT_Body, type TNamexxx_PUT_Response } from "./dto";
import { clientBase } from "$src/client.base";


export async function clientRequestNamexxx_PUT(body: TNamexxx_PUT_Body): Promise<TNamexxx_PUT_Response | null> {

    const { data, error } = await apiRequest<TNamexxx_PUT_Response, TNamexxx_PUT_Body>({
        url: clientBase.automaticApiUrl(import.meta.url),
        method: "PUT",
        body
    });

    if (error) {
        return null;
    }

    return data!.output;
}