/** Empty string = same origin (use Vite /api proxy in dev). Set VITE_API_BASE_URL for a remote API in production. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
