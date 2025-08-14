
import { ENamexxx_GET_ErrorCodes, SNamexxx_GET_Query, SNamexxx_GET_Response, type TNamexxx_GET_Response } from "./dto";
import type { TEndpointError } from "$redlionsoft/common/backend-frontend/endpoints.types";
import { EndpointGenerator } from "$src/backend.base";

export const GET = EndpointGenerator.RLS_QUERY_ENDPOINT(`${import.meta.url}`,SNamexxx_GET_Query, SNamexxx_GET_Response, { requireAuthentication: false, requirePermissions: [], responseHeaders: { "Content-Type": "application/json" } }, async ({ params, query, user, request, url }) => { 
    const { id } = params;
    
          if (id === undefined) {
                const error: TEndpointError
                    = {
                  errorCode: ENamexxx_GET_ErrorCodes.ID_NOT_FOUND,
                    details: "Error",
                    status: 401,
                  toastError: "Autotoast",
                }
    
                return error;
          }
    

  const data: TNamexxx_GET_Response = {
    output: id,
  }

  return data;
 });


