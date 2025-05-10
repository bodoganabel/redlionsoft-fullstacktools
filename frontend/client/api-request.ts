import { AnyARecord } from "dns";

// Types
export type ApiResponse<TData> = {
  data: TData | null;
  error: ApiError | null;
  status: number | null;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ApiRequestConfig<TBody = unknown> = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: TBody;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

export type ApiRequestOptions = {
  errorMessages?: Record<string, string>;
  defaultErrorMessage?: string;
};

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
export async function apiRequest<TData = any>(
  config: ApiRequestConfig,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<TData>> {
  const {
    url,
    method = "GET",
    body,
    headers = { "Content-Type": "application/json" },
    credentials = "include",
  } = config;

  console.log("body:");
  console.log(body);

  const { errorMessages = {}, defaultErrorMessage = "An error occurred" } =
    options;

  try {
    const response = await fetch(url, {
      method,
      credentials,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorResponse;
      try {
        errorResponse = await response.json();
      } catch {
        errorResponse = { message: "Failed to parse error response" };
      }

      const error: ApiError = {
        message:
          errorMessages[errorResponse.message] ||
          errorResponse.message ||
          defaultErrorMessage,
        code: errorResponse.code,
        details: errorResponse,
      };

      return {
        data: null,
        error,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Network error occurred",
        details: error,
      },
      status: null,
    };
  }
}

export async function apiRequest_v2<TRequestBody, TResponseData>(
  config: ApiRequestConfig<TRequestBody>,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<TResponseData | ApiError>> {
  const {
    url,
    method = "GET",
    body,
    headers = { "Content-Type": "application/json" },
    credentials = "include",
  } = config;

  console.log("body:");
  console.log(body);

  const { errorMessages = {}, defaultErrorMessage = "An error occurred" } =
    options;

  try {
    const response = await fetch(url, {
      method,
      credentials,
      headers,
      body: body as TRequestBody ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorResponse;
      try {
        errorResponse = await response.json();
      } catch {
        errorResponse = { message: "Failed to parse error response" };
      }

      const error: ApiError = {
        message:
          errorMessages[errorResponse.message] ||
          errorResponse.message ||
          defaultErrorMessage,
        code: errorResponse.code,
        details: errorResponse,
      };

      return {
        data: null,
        error,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Network error occurred",
        details: error,
      },
      status: null,
    };
  }
}