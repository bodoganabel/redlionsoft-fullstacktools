// @ts-nocheck

import { ENamexxx_GET_ErrorCodes, SNamexxx_GET_Query, SNamexxx_GET_Response, type TNamexxx_GET_Response } from "./dto";


export const GET = RedlionsoftEndpointGenerator.RLS_QUERY_ENDPOINT(SNamexxx_GET_Query, SNamexxx_GET_Response,{requireAuthentication:false,requirePermissions: [], responseHeaders: { "Content-Type": "application/json" }}, async ({params,query,user,request,url}) => { 
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


