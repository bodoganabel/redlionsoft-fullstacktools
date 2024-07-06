
export function setCookieHeader(headers: Headers, key: string, value: string, path = '/') {
    headers.append('Set-Cookie', `${key}=${value}; Path=${path}; HttpOnly; SameSite=Strict`);
  }
  