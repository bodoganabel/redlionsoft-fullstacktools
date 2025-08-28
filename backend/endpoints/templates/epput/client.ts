// @ts-nocheck

import { apiRequest } from "$redlionsoft/frontend/client/api-request";
import { toastError } from "$redlionsoft/frontend/functionality/toast/toast-logic";
import { ENamexxx_PUT_ErrorCodes, type TNamexxx_PUT_Body, type TNamexxx_PUT_Response } from "./dto";


export async function clientRequestNamexxx_PUT(body: TNamexxx_PUT_Body): Promise<any | null> {

    const { data, error } = await apiRequest<TNamexxx_PUT_Response, TNamexxx_PUT_Body>({
        url: `/events/input/api`,
        method: "PUT",
        body
    });

    if (error) {
        return null;
    }

    return data!.output;
}