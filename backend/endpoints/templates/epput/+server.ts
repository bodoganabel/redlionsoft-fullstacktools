import { ENamexxx_PUT_ErrorCodes, SNamexxx_PUT_Body, SNamexxx_PUT_Response, type TNamexxx_PUT_Response } from "./dto";
import type { TEndpointError } from "$redlionsoft/common/backend-frontend/endpoints.types";
import { EndpointGenerator } from "$src/backend.base";


//+server.ts
export const PUT = EndpointGenerator.RLS_BODY_ENDPOINT(`${import.meta.url}`, SNamexxx_PUT_Body, SNamexxx_PUT_Response, { requireAuthentication: true, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async ({ params, body, user, request, url }) => {


  const { id } = params;

  const error: TEndpointError
      = {
      errorCode: ENamexxx_PUT_ErrorCodes.ID_NOT_FOUND,
      details: "Not implemented yet",
      status: 401,
      toastError: "Not implemented yet",
    }
  
    return error;
  const data: TNamexxx_PUT_Response = {
    output: "Success",
  }

  return data;


});

