import { env } from "@/lib/env";
import type { ApiResponse } from "@/types/api";

/** Error returned by the backend; `code` matches the backend ErrorCode enum (e.g. SEAT_NOT_AVAILABLE). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Client-only code for "backend unreachable" (status 0), not a backend ErrorCode. */
export const NETWORK_ERROR = "NETWORK_ERROR";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  accessToken?: string;
};

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the session cookies. Single-flight: concurrent 401s share one refresh call, because the backend
 * treats two refreshes with the same token as token theft and revokes every session.
 */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${env.apiUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Calls the backend REST API and unwraps the ApiResponse envelope.
 * Returns `data` on success, throws ApiError on failure.
 * In the browser, an expired access token (401 UNAUTHORIZED) is refreshed once and the request retried.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...init } = options;

  const send = () =>
    fetch(`${env.apiUrl}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  let payload: ApiResponse<T> | null;
  try {
    res = await send();
    payload = await readPayload<T>(res);

    if (
      res.status === 401 &&
      payload?.code === "UNAUTHORIZED" &&
      typeof window !== "undefined" &&
      (await refreshSession())
    ) {
      res = await send();
      payload = await readPayload<T>(res);
    }
  } catch {
    throw new ApiError(0, NETWORK_ERROR, "Cannot reach the server");
  }

  if (!res.ok || !payload?.success) {
    throw new ApiError(
      res.status,
      payload?.code ?? "UNKNOWN_ERROR",
      payload?.message ?? res.statusText,
      payload?.data,
    );
  }
  return payload.data as T;
}

function readPayload<T>(res: Response): Promise<ApiResponse<T> | null> {
  return res.json().catch(() => null) as Promise<ApiResponse<T> | null>;
}
