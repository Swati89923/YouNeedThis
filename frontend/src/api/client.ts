import type { Session } from "./types";

export const API_URL: string = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

const STORAGE_KEY = "feedback-exchange.session";

/** Thrown for every non-2xx answer. `status` 0 means the server was unreachable. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------- session storage ----------

export function decodeExpiry(token: string): number | null {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const expiresAt = decodeExpiry(session.token);
    if (!session.token || (expiresAt !== null && expiresAt <= Date.now())) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage can be blocked; the session then lasts until reload */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- requests ----------

let onUnauthorized: (() => void) | null = null;

/** The auth provider registers a callback that logs the user out on a 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip the logout-on-401 behaviour (used by the login call itself). */
  anonymous?: boolean;
}

export async function request<T>(
  path: string,
  { method = "GET", body, anonymous = false }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const session = anonymous ? null : loadSession();
  if (session) headers.Authorization = `Bearer ${session.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 401 && !anonymous) {
    onUnauthorized?.();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
