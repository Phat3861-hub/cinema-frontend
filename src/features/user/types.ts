import type { RoleScope, UserRole, UserStatus } from "@/features/auth/types";

/** Mirrors UserResponse. */
export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Mirrors UserListItemResponse: a row of `GET /users`, with every role assignment. */
export interface AdminUserListItem extends AdminUser {
  roles: UserRole[];
}

/** Query of `GET /users`; `roleCode` + `cinemaId` = that role at that cinema. */
export interface UserFilter {
  keyword?: string;
  status?: UserStatus;
  roleCode?: string;
  cinemaId?: number;
  page?: number;
  size?: number;
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
  /** Users holding the role (any cinema); only a custom role nobody holds can be deleted. */
  userCount: number;
  permissions: string[];
}

/** `POST /roles`: code (stored upper case) and scope are fixed after creation. */
export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  scopeType: RoleScope;
  permissionCodes: string[];
}

/** `PUT /roles/{id}`: custom roles only. */
export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

/** Mirrors PermissionResponse; `module` groups the matrix (MOVIE, CINEMA, SHOWTIME…). */
export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string | null;
  /** Checked per cinema, so a CINEMA role may hold it; the others only go to GLOBAL roles. */
  cinemaScoped: boolean;
}
