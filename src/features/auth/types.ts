/** Mirrors com.pnt.cinema.modules.auth.entity.UserStatus. */
export type UserStatus = "PENDING" | "ACTIVE" | "LOCKED";

/** GLOBAL = whole system, CINEMA = bound to one cinema (`cinemaId`). */
export type RoleScope = "GLOBAL" | "CINEMA";

/** Mirrors UserRoleResponse; `id` is the user_roles row id. */
export interface UserRole {
  id: number;
  roleCode: string;
  roleName: string;
  scopeType: RoleScope;
  cinemaId: number | null;
  assignedAt: string;
}

/** Mirrors CurrentUserResponse (`GET /auth/me`). */
export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  roles: UserRole[];
  permissions: string[];
}

/** Mirrors AuthSessionResponse (login / refresh / change-password). Tokens are HttpOnly cookies. */
export interface AuthSession {
  user: CurrentUser;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

/** Mirrors UserResponse (register). */
export interface RegisteredUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
