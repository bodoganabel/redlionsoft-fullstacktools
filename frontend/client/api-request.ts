
import type { ApiRequestConfig, ApiRequestOptions, ApiResponse, TEndpointError } from "../../common/backend-frontend/endpoints.types";
import { toastError } from "../functionality/toast/toast-logic";
import { logFocusedValidationErrors } from "../../common/utilities/validation-error-formatter";
/**
 * Makes an API request and returns a strongly typed response
 * @example
 * ```ts
 * const { data, error } = await apiRequest<User>({
 *   url: '/api/users',
 *   method: 'POST',
 *   body: { name: 'John' }
 * });
 *
 * if (error) {
 *   console.error(error.message);
 *   return;
 * }
 *
 * console.log(data); // Typed as User
 * ```
 */
export async function apiRequest<TData = any, TInputData = any>(
  config: ApiRequestConfig<TInputData>,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<TData>> {
  const {
    url,
    method = "GET",
    query,
    body,
    headers = { "Content-Type": "application/json" },
    credentials = "include",
    querySchema,
    bodySchema,
  } = config;

  const { defaultErrorMessage = "An unspecified error occurred" } =
    options;

  // Client-side validation for query parameters
  if (querySchema && query) {
    const queryValidation = querySchema.safeParse(query);
    console.log("queryValidation");
    if (!queryValidation.success) {
      console.log(`🔍 Client-side query validation failed for: ${url}`);
      logFocusedValidationErrors(queryValidation.error, query, `${method} ${url} - Query`);
      
      toastError("Invalid query parameters");
      
      return {
        data: null,
        error: {
          errorCode: "CLIENT_VALIDATION_ERROR",
          details: "Query parameters validation failed",
          status: 400,
        },
        status: 400,
      };
    }
  }

  // Client-side validation for body parameters
  if (bodySchema && body) {
    const bodyValidation = bodySchema.safeParse(body);
    console.log("body validation")
    if (!bodyValidation.success) {
      console.log(`🔍 Client-side body validation failed for: ${url}`);
      logFocusedValidationErrors(bodyValidation.error, body, `${method} ${url} - Body`);
      
      toastError("Invalid request data");
      
      return {
        data: null,
        error: {
          errorCode: "CLIENT_VALIDATION_ERROR",
          details: "Request body validation failed",
          status: 400,
        },
        status: 400,
      };
    }
  }

  try {
    const response = await fetch(url + (query ? `?${new URLSearchParams(query).toString()}` : ""), {
      method,
      credentials,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      let error: TEndpointError;
      try {
        error = {
          status: response.status || 400,
          errorCode: "SERVER_DEFAULT_ERROR",
          details: defaultErrorMessage,
          ...data.error,
        };
      } catch {
        error = {
          errorCode: "SERVER_DEFAULT_ERROR",
          details: defaultErrorMessage,
          status: response.status || 400,
        };
      }

      if (error.toastError) {
        toastError(error.toastError);
      }

      return {
        data: null,
        error,
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        errorCode: error instanceof Error ? error.message : "Network error occurred",
        status: 500,
        details: error instanceof Error ? error.message : "Network error occurred",
      },
      status: null,
    };
  }
}