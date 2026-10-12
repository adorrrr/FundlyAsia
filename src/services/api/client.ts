/**
 * HTTP client for the future Fundly API. Not used in preview mode.
 *
 * To connect a backend: set VITE_DATA_MODE=api and VITE_API_BASE_URL, implement the
 * service interfaces in src/services/*.ts with apiRequest(), and switch the exports in
 * src/services/index.ts. Pages only talk to the service interfaces, so they don't change.
 */
export const DATA_MODE: 'mock' | 'api' = import.meta.env.VITE_DATA_MODE === 'api' ? 'api' : 'mock';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // session cookie set by the server
    headers: { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json ? JSON.stringify(json) : init.body,
    ...rest,
  });
  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = await res.json();
      message = body.message ?? message;
      code = body.code;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, message, code);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
