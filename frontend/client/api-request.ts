
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

/**
 * Extracts the endpoint URL from import.meta.url by removing everything before SvelteKit route patterns.
 * Handles both grouped routes like src/routes/(private)/ and regular routes like src/routes/
 * 
 * @param importMetaUrl - The import.meta.url string from the calling file
 * @returns The endpoint path starting from the route pattern
 * 
 * @example
 * // For: file:///path/to/project/src/routes/(private)/api/users/+server.ts
 * // Returns: /api/users
 * 
 * // For: file:///path/to/project/src/routes/api/events/+server.ts  
 * // Returns: /api/events
 */
export function extractEndpointFromImportUrl(importMetaUrl: string): string {
  // Pattern to match src/routes/ optionally followed by grouped route like (private)
  const routePattern = /.*\/src\/routes\/(?:\([^)]+\)\/)?/;

  // Remove everything before and including the route pattern
  const endpointPath = importMetaUrl.replace(routePattern, '/');

  // Remove file extensions and SvelteKit specific files
  const result = endpointPath
    .replace(/\/\+server\.ts$/, '')
    .replace(/\/client\.ts$/, '')
    .replace(/\.ts$/, '');

  console.log("result");
  console.log(result);
  return result;
}

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
  } = config;

  const { defaultErrorMessage = "An unspecified error occurred" } =
    options;
  
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