// @ts-nocheck
import { ENamexxx_PUT_ErrorCodes, SNamexxx_PUT_Body, SNamexxx_PUT_Response, type TNamexxx_PUT_Response } from "./dto";



//+server.ts
export const PUT = EndpointGenerator.RLS_BODY_ENDPOINT(`${import.meta.url}`, SNamexxx_PUT_Body, SNamexxx_PUT_Response, { requireAuthentication: true, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async ({ params, body, user, request, url }) => {


  const { id } = params;

  if (id === undefined) {
    const error: TEndpointError
      = {
      errorCode: ENamexxx_PUT_ErrorCodes.ID_NOT_FOUND,
      details: "Error",
      status: 401,
      toastError: "Autotoast",
    }

    return error;
  }

  const data: TNamexxx_POST_Response = {
    output: "Success",
  }

  return data;


});

