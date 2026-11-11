import type { Messages } from "@/i18n/messages/vi";
import { ApiError } from "@/lib/api-client";

/** Text per backend ErrorCode in the current language (`t.errors`); the backend English `message` is never shown. */
export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

export function getErrorMessage(error: unknown, t: Messages): string {
  const code = errorCodeOf(error);
  if (code === "TOO_MANY_REQUESTS") {
    const seconds = retryAfterSeconds(error);
    if (seconds !== undefined)
      return seconds < 60 ? t.rateLimit.retryInSeconds(seconds) : t.rateLimit.retryInMinutes(Math.ceil(seconds / 60));
  }
  const messages: Record<string, string> = t.errors;
  return (code && messages[code]) || t.errors.FALLBACK;
}

/**
 * Field names of a VALIDATION_FAILED response (`data` = field -> English message), mapped to the generic
 * "invalid value" key. The client validates with the same rules first, so these are rare.
 */
export function getFieldErrors(error: unknown): Record<string, "invalid"> {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_FAILED") return {};
  if (typeof error.details !== "object" || error.details === null) return {};
  return Object.fromEntries(Object.keys(error.details).map((field) => [field, "invalid" as const]));
}

/** Seconds to wait after a 429 `TOO_MANY_REQUESTS` (`data.retryAfterSeconds`, same as the `Retry-After` header). */
export function retryAfterSeconds(error: unknown): number | undefined {
  if (!(error instanceof ApiError) || error.code !== "TOO_MANY_REQUESTS") return undefined;
  const seconds = (error.details as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds;
  return typeof seconds === "number" && seconds > 0 ? Math.ceil(seconds) : undefined;
}
