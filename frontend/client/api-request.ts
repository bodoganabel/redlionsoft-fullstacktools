import RequestCredentials from '@sveltejs/kit';


const ERROR_NO_RESPONSE = 'No response from server';


export type CallEndpointOptions = {
    url?: string;
    method?: string;
    body?: any | null | undefined;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    clientErrorMessages?: { parseError: string; message: string }[];
    defaultErrorMessage?: string | undefined;
    onSuccess?: (data: any) => void;
    onError?: (errorResponse: any) => void;
};

// Adapter function for callEndpointWithParams
export async function callEndpoint<TData, TError>(options: CallEndpointOptions) {
    const url = options.url || '/';
    const method = options.method || 'GET';
    const body = options.body || null;
    const credentials = options.credentials || 'include';
    const headers = options.headers || { 'Content-Type': 'application/json' };
    const clientErrorMessages = options.clientErrorMessages || [{ parseError: 'Error', message: 'Request failed' }];
    const defaultErrorMessage = options.defaultErrorMessage;
    const onSuccess = options.onSuccess;
    const onError = options.onError;

    return await callEndpointWithParams<TData, TError>(
        url,
        method,
        body,
        credentials,
        headers,
        clientErrorMessages,
        defaultErrorMessage,
        onSuccess,
        onError
    );

}
/**
 * Async function to call an API endpoint with parameters.
 *
 * @param {string} url - The URL of the endpoint. Default is '/'.
 * @param {string} method - The HTTP method to use. Default is 'GET'.
 * @param {any | null | undefined} body - The body of the request. Default is null.
 * @param {RequestCredentials} credentials - The credentials mode for the request. Default is 'include'.
 * @param {HeadersInit} headers - The headers for the request. Default is { 'Content-Type': 'application/json' }.
 * @param {{parseError: string; message: string}[]} clientErrorMessages - Array of error messages. Default is [{ parseError: 'Error', message: 'Request failed' }].
 * @param {string | undefined} defaultErrorMessage - The default error message. Default is undefined.
 * @param {(data: TData) => void} onSuccess - Callback function for successful response.
 * @param {(errorResponse: TError) => void} onError - Callback function for error response.
 * @return {Promise<{response: Response | null, error: boolean, clientErrorMessage: string | null}>} Object containing response, error status, and client error message.
 */
export async function callEndpointWithParams<TData, TError>(
    url: string = '/',
    method: string = 'GET',
    body: any | null | undefined = null,
    credentials: RequestCredentials = 'include',
    headers: HeadersInit = { 'Content-Type': 'application/json' },
    clientErrorMessages: { parseError: string; message: string }[] = [{ parseError: 'Error', message: 'Request failed' }],
    defaultErrorMessage: string | undefined = undefined,
    onSuccess?: (data: TData) => void,
    onError?: (errorResponse: TError) => void
) {
    try {
        const requestInit: RequestInit = {
            method,
            credentials,
            headers,
            body: body !== null ? JSON.stringify(body) : undefined,
        };

        const response = await fetch(url, requestInit);

        console.log('response:');
        console.log(response);
        if (!response.ok) {
            const errorResponse = await response.json();

            const parsedError = clientErrorMessages.find(
                (messageMap) => messageMap.parseError === errorResponse.message
            )?.message || defaultErrorMessage || errorResponse.message || 'Error';

            if (onError) onError(errorResponse);
            return {
                response,
                error: true,
                clientErrorMessage: parsedError,
            };
        }

        const data = (await response.json());
        if (onSuccess) onSuccess(data);
        return {
            response,
            data,
            error: false,
            clientErrorMessage: null,
        };
    } catch (error) {
        console.error(error);
        return {
            response: null,
            error: true,
            clientErrorMessage: ERROR_NO_RESPONSE,
        };
    }
}
