import type { Messages } from "@/i18n/messages/vi";
import { ApiError } from "@/lib/api-client";

/** Text per backend ErrorCode in the current language (`t.errors`); the backend English `message` is never shown. */
export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

export function getErrorMessage(error: unknown, t: Messages): string {
  const code = errorCodeOf(error);
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
