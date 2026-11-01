/**
 * Client-side checks mirroring the backend DTO constraints (RegisterRequest, @StrongPassword…).
 * They return a key of `t.validation`, so the form shows the message in the current language.
 */
import type { Messages } from "@/i18n/messages/vi";

export type ValidationKey = keyof Messages["validation"];

// Same patterns as ValidationPatterns.java.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const VN_PHONE_PATTERN = /^(0|\+84)[35789]\d{8}$/;

export type FieldErrors<K extends string> = Partial<Record<K, ValidationKey>>;

export function validateEmail(value: string): ValidationKey | undefined {
  const email = value.trim();
  if (!email) return "emailRequired";
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) return "emailInvalid";
}

/** Login only checks presence: the policy may have changed since the account was created. */
export function validateLoginPassword(value: string): ValidationKey | undefined {
  if (!value) return "passwordRequired";
  if (value.length > 72) return "passwordTooLong";
}

export function validateFullName(value: string): ValidationKey | undefined {
  const name = value.trim();
  if (!name) return "fullNameRequired";
  if (name.length > 100) return "fullNameTooLong";
}

export function validatePhone(value: string): ValidationKey | undefined {
  const phone = value.trim();
  if (phone && !VN_PHONE_PATTERN.test(phone)) return "phoneInvalid";
}

/** Rules of @StrongPassword, listed so the form can show which ones are met. */
export const PASSWORD_RULES = [
  { key: "length", test: (v: string) => v.length >= 8 && v.length <= 72 },
  { key: "case", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: "digit", test: (v: string) => /\d/.test(v) },
  { key: "noSpace", test: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

export function validateNewPassword(value: string): ValidationKey | undefined {
  if (!value) return "passwordRequired";
  if (!PASSWORD_RULES.every((rule) => rule.test(value))) return "passwordWeak";
}

export function validateConfirmPassword(value: string, password: string): ValidationKey | undefined {
  if (!value) return "confirmRequired";
  if (value !== password) return "confirmMismatch";
}

export function hasErrors<K extends string>(errors: FieldErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Translated message of a field error key (undefined stays undefined). */
export function fieldMessage(t: Messages, key: ValidationKey | undefined): string | undefined {
  return key ? t.validation[key] : undefined;
}
