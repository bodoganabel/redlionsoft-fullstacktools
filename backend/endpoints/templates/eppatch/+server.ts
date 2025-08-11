// @ts-nocheck
import { ENamexxx_PATCH_ErrorCodes, SNamexxx_PATCH_Body, SNamexxx_PATCH_Response, type TNamexxx_PATCH_Response } from "./dto";



//+server.ts
export const PATCH = EndpointGenerator.RLS_BODY_ENDPOINT(`${import.meta.url}`, SNamexxx_PATCH_Body, SNamexxx_PATCH_Response, { requireAuthentication: true, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async ({ params, body, user, request, url }) => {


  const { id } = params;

  if (id === undefined) {
    const error: TEndpointError
      = {
      errorCode: ENamexxx_PATCH_ErrorCodes.ID_NOT_FOUND,
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

