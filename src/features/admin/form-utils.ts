import type { Messages } from "@/i18n/messages/vi";
import { errorCodeOf, getFieldErrors } from "@/lib/error-messages";

/** Small checks shared by the admin forms; each returns a translated message or undefined. */
export function adminChecks(t: Messages) {
  const v = t.admin.validation;
  return {
    required: (value: string) => (value.trim() ? undefined : v.required),
    maxLength: (value: string, max: number) => (value.trim().length > max ? v.tooLong(max) : undefined),
    url: (value: string) => (!value.trim() || /^https?:\/\/\S+$/i.test(value.trim()) ? undefined : v.url),
    intRange: (value: string, min: number, max: number) => {
      const n = Number(value);
      return value.trim() && Number.isInteger(n) && n >= min && n <= max ? undefined : v.range(min, max);
    },
    numberRange: (value: string, min: number, max: number) => {
      const n = Number(value);
      return value.trim() !== "" && Number.isFinite(n) && n >= min && n <= max ? undefined : v.range(min, max);
    },
  };
}

export type Errors<K extends string> = Partial<Record<K, string>>;

export function anyError<K extends string>(errors: Errors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Backend VALIDATION_FAILED field names → generic "invalid value" message on those fields. */
export function backendFieldErrors<K extends string>(error: unknown, t: Messages): Errors<K> {
  if (errorCodeOf(error) !== "VALIDATION_FAILED") return {};
  return Object.fromEntries(Object.keys(getFieldErrors(error)).map((field) => [field, t.validation.invalid])) as Errors<K>;
}

/** Empty string → undefined, so optional fields are omitted from the request. */
export function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
