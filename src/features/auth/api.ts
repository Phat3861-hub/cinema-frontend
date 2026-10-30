import { apiFetch } from "@/lib/api-client";
import type {
  AuthSession,
  CurrentUser,
  LoginRequest,
  RegisteredUser,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/features/auth/types";

/** `/api/v1/auth/*` – the backend sets / clears the HttpOnly cookies itself. */
export const authApi = {
  login: (body: LoginRequest) => apiFetch<AuthSession>("/auth/login", { method: "POST", body }),
  register: (body: RegisterRequest) => apiFetch<RegisteredUser>("/auth/register", { method: "POST", body }),
  verifyEmail: (token: string) => apiFetch<void>("/auth/verify-email", { method: "POST", body: { token } }),
  resendVerification: (email: string) =>
    apiFetch<void>("/auth/resend-verification", { method: "POST", body: { email } }),
  forgotPassword: (email: string) => apiFetch<void>("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (body: ResetPasswordRequest) =>
    apiFetch<void>("/auth/reset-password", { method: "POST", body }),
  me: () => apiFetch<CurrentUser>("/auth/me"),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
};
