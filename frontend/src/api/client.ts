export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:8000/api";

export function getToken(): string | null {
  return window.localStorage.getItem("auth_token");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    if (isJson) {
      try {
        const body = await res.json();
        if (body?.detail) detail = body.detail;
        else detail = JSON.stringify(body);
      } catch {
        // ignore
      }
    }
    throw new Error(detail);
  }

  if (isJson) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

