export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export type ApiRequestOptions = RequestInit;

function csrfToken(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.cookie
    .split('; ')
    .find((value) => value.startsWith('wd_csrf='))
    ?.split('=')
    .slice(1)
    .join('=');
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { error?: string }).error || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())) {
    const token = csrfToken();
    if (token) {
      headers.set('X-CSRF-Token', decodeURIComponent(token));
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'include',
  });

  return parseResponse<T>(response);
}
