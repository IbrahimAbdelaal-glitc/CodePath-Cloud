// Shared HTTP client for the CodePath Cloud API.
// VITE_API_URL: API origin in production (e.g. https://<your-api-service>.onrender.com). Leave empty locally to use the Vite proxy.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Absolute address of an API resource the browser opens directly (for example a PDF download)
export const apiUrl = (path) => `${BASE_URL}${path}`;
const TOKEN_KEY = 'codepath.token';


export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable (private mode) */
    }
  },
};

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json', 'Accept-Language': 'en' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.', { code: 'NETWORK' });
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = data?.error || {};
    if (response.status === 401 && token) {
      tokenStore.set(null);
      window.dispatchEvent(new Event('codepath:unauthorized'));
    }
    throw new ApiError(response.status, err.message || 'Something went wrong, please try again.', {
      code: err.code,
      details: err.details,
    });
  }
  return data;
}
