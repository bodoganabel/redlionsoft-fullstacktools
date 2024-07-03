
export function setCookieHeader(headers: Headers, key: string, value: string) {
    headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Strict`);
  }
  