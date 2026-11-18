const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const TOKEN_STORAGE_KEY = 'hausco_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  public status: number;
  public payload: Record<string, unknown>;

  constructor(status: number, message: string, payload: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const msg = typeof data.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}

export function formatLkr(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Locked';
  return `LKR ${Math.round(value).toLocaleString('en-LK')}`;
}
