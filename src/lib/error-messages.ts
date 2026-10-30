import { ApiError, NETWORK_ERROR } from "@/lib/api-client";

/** Vietnamese text per backend ErrorCode; the backend English `message` is only a fallback. */
const MESSAGES: Record<string, string> = {
  [NETWORK_ERROR]: "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.",
  INTERNAL_ERROR: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
  BAD_REQUEST: "Yêu cầu không hợp lệ.",
  VALIDATION_FAILED: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.",
  UNAUTHORIZED: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",

  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  PHONE_ALREADY_EXISTS: "Số điện thoại này đã được sử dụng.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_NOT_VERIFIED: "Tài khoản chưa xác thực email.",
  ACCOUNT_LOCKED: "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.",
  REFRESH_TOKEN_INVALID: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  TOKEN_INVALID: "Link không hợp lệ hoặc đã được sử dụng.",
  TOKEN_EXPIRED: "Link đã hết hạn.",
  CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không đúng.",
  NEW_PASSWORD_SAME_AS_CURRENT: "Mật khẩu mới phải khác mật khẩu hiện tại.",
};

const FALLBACK = "Đã có lỗi xảy ra. Vui lòng thử lại.";

export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

export function getErrorMessage(error: unknown): string {
  const code = errorCodeOf(error);
  return (code && MESSAGES[code]) || FALLBACK;
}

/**
 * Field errors of a VALIDATION_FAILED response (`data` = field -> English message).
 * The client validates with the same rules first, so these are rare; show a generic Vietnamese text.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_FAILED") return {};
  if (typeof error.details !== "object" || error.details === null) return {};
  return Object.fromEntries(Object.keys(error.details).map((field) => [field, "Giá trị không hợp lệ."]));
}
