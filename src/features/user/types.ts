import type { RoleScope, UserRole, UserStatus } from "@/features/auth/types";

/** Mirrors UserResponse. */
export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Mirrors UserDetailResponse (`GET /users/{id}`). */
export interface UserDetail {
  user: AdminUser;
  roles: UserRole[];
}

/** Mirrors RoleResponse. */
export interface Role {
  id: number;
  code: string;
  name: string;
  description: string | null;
  scopeType: RoleScope;
  system: boolean;
  permissions: string[];
}

/** Mirrors PermissionResponse; `module` groups the matrix (MOVIE, CINEMA, SHOWTIME…). */
export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string | null;
}
