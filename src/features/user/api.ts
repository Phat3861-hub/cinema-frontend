import type { UserRole } from "@/features/auth/types";
import type { AdminUser, Permission, Role, UserDetail } from "@/features/user/types";
import { apiFetch } from "@/lib/api-client";

type Id = number | string;

/** `/api/v1/users/*` (USER_MANAGE / ROLE_MANAGE) and `/roles`, `/permissions` (ROLE_MANAGE). */
export const userApi = {
  get: (userId: Id) => apiFetch<UserDetail>(`/users/${userId}`),
  lock: (userId: Id) => apiFetch<AdminUser>(`/users/${userId}/lock`, { method: "PATCH" }),
  unlock: (userId: Id) => apiFetch<AdminUser>(`/users/${userId}/unlock`, { method: "PATCH" }),
  roles: (userId: Id) => apiFetch<UserRole[]>(`/users/${userId}/roles`),
  assignRole: (userId: Id, body: { roleCode: string; cinemaId?: number }) =>
    apiFetch<UserRole>(`/users/${userId}/roles`, { method: "POST", body }),
  removeRole: (userId: Id, userRoleId: Id) =>
    apiFetch<void>(`/users/${userId}/roles/${userRoleId}`, { method: "DELETE" }),
};

export const rbacApi = {
  roles: () => apiFetch<Role[]>("/roles"),
  permissions: () => apiFetch<Permission[]>("/permissions"),
  setRolePermissions: (roleId: Id, permissionCodes: string[]) =>
    apiFetch<Role>(`/roles/${roleId}/permissions`, { method: "PUT", body: { permissionCodes } }),
};
