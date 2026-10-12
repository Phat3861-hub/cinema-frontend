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

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  accessToken?: string;
};

/**
 * Calls the backend REST API and unwraps the ApiResponse envelope.
 * Returns `data` on success, throws ApiError on failure.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...init } = options;

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;

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
