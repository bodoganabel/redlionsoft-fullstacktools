import { ENamexxx_POST_ErrorCodes, SNamexxx_POST_Body, SNamexxx_POST_Response, type TNamexxx_POST_Response } from "./dto";
import type { TEndpointError } from "$redlionsoft/common/backend-frontend/endpoints.types";
// @ts-ignore
import { RedlionsoftEndpointGenerator } from "$src/backend.base";


//+server.ts
export const POST = RedlionsoftEndpointGenerator.RLS_BODY_ENDPOINT(SNamexxx_POST_Body, SNamexxx_POST_Response, { requireAuthentication: true, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async (
  // @ts-ignore
  { params, body, user, request, url }) => {


  const { id } = params;

  if (id === undefined) {
    const error: TEndpointError
      = {
      errorCode: ENamexxx_POST_ErrorCodes.ID_NOT_FOUND,
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

