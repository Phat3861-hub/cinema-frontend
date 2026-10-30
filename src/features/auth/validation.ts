/** Client-side checks mirroring the backend DTO constraints (RegisterRequest, @StrongPassword…). */

// Same patterns as ValidationPatterns.java.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const VN_PHONE_PATTERN = /^(0|\+84)[35789]\d{8}$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Vui lòng nhập email.";
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) return "Email không đúng định dạng.";
}

/** Login only checks presence: the policy may have changed since the account was created. */
export function validateLoginPassword(value: string): string | undefined {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length > 72) return "Mật khẩu tối đa 72 ký tự.";
}

export function validateFullName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Vui lòng nhập họ tên.";
  if (name.length > 100) return "Họ tên tối đa 100 ký tự.";
}

export function validatePhone(value: string): string | undefined {
  const phone = value.trim();
  if (phone && !VN_PHONE_PATTERN.test(phone)) return "Số điện thoại không hợp lệ (vd: 0912345678).";
}

/** Rules of @StrongPassword, listed so the form can show which ones are met. */
export const PASSWORD_RULES = [
  { label: "8–72 ký tự", test: (v: string) => v.length >= 8 && v.length <= 72 },
  { label: "Có chữ thường và chữ hoa", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "Có ít nhất một chữ số", test: (v: string) => /\d/.test(v) },
  { label: "Không có khoảng trắng", test: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (!PASSWORD_RULES.every((rule) => rule.test(value))) return "Mật khẩu chưa đáp ứng đủ yêu cầu bên dưới.";
}

export function validateConfirmPassword(value: string, password: string): string | undefined {
  if (!value) return "Vui lòng nhập lại mật khẩu.";
  if (value !== password) return "Mật khẩu nhập lại không khớp.";
}

export function hasErrors<K extends string>(errors: FieldErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}
