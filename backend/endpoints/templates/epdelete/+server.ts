// @ts-nocheck
import { ENamexxx_DELETE_ErrorCodes, SNamexxx_DELETE_Body, SNamexxx_DELETE_Response, type TNamexxx_DELETE_Response } from "./dto";



//+server.ts
export const DELETE = EndpointGenerator.RLS_BODY_ENDPOINT(SNamexxx_DELETE_Body, SNamexxx_DELETE_Response, { requireAuthentication: true, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async ({ params, body, user, request, url }) => {


  const { id } = params;

  if (id === undefined) {
    const error: TEndpointError
      = {
      errorCode: ENamexxx_DELETE_ErrorCodes.ID_NOT_FOUND,
      details: "Error",
      status: 401,
      toastError: "Autotoast",
    }

    return error;
  }

  const data: TNamexxx_DELETE_Response = {
    outDELETE: "Success",
  }

  return data;


});

