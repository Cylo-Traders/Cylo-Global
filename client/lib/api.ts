/**
 * Typed fetch wrapper that auto-attaches the Privy JWT on every request.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api";
 *   const data = await apiClient(getAccessToken).get<IProfile>("/api/profile");
 *   const result = await apiClient(getAccessToken).post<RegisterResponse>("/api/auth/register", body);
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type GetAccessToken = () => Promise<string | null>;

async function request<T>(
  getAccessToken: GetAccessToken,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiClient(getAccessToken: GetAccessToken) {
  return {
    get: <T>(path: string) => request<T>(getAccessToken, "GET", path),
    post: <T>(path: string, body?: unknown) => request<T>(getAccessToken, "POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>(getAccessToken, "PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>(getAccessToken, "PATCH", path, body),
    del: <T>(path: string) => request<T>(getAccessToken, "DELETE", path),
  };
}
