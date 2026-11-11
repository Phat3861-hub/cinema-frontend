import type { UserRole } from "@/features/auth/types";
import type { Booking, BookingStatus } from "@/features/booking/types";
import type {
  AdminUser,
  AdminUserListItem,
  CreateRoleRequest,
  Permission,
  Role,
  UpdateRoleRequest,
  UserDetail,
  UserFilter,
} from "@/features/user/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

type Id = number | string;

/** `/api/v1/users/*` (USER_MANAGE / ROLE_MANAGE) and `/roles`, `/permissions` (ROLE_MANAGE). */
export const userApi = {
  list: (filter: UserFilter) => apiFetch<PageResponse<AdminUserListItem>>("/users", { query: { ...filter } }),
  get: (userId: Id) => apiFetch<UserDetail>(`/users/${userId}`),
  lock: (userId: Id) => apiFetch<AdminUser>(`/users/${userId}/lock`, { method: "PATCH" }),
  unlock: (userId: Id) => apiFetch<AdminUser>(`/users/${userId}/unlock`, { method: "PATCH" }),
  roles: (userId: Id) => apiFetch<UserRole[]>(`/users/${userId}/roles`),
  assignRole: (userId: Id, body: { roleCode: string; cinemaId?: number }) =>
    apiFetch<UserRole>(`/users/${userId}/roles`, { method: "POST", body }),
  removeRole: (userId: Id, userRoleId: Id) =>
    apiFetch<void>(`/users/${userId}/roles/${userRoleId}`, { method: "DELETE" }),
  /** BOOKING_VIEW_ALL: the account's online bookings and counter sales, newest first. */
  bookings: (userId: Id, query: { status?: BookingStatus; page?: number; size?: number }) =>
    apiFetch<PageResponse<Booking>>(`/users/${userId}/bookings`, { query: { ...query } }),
};

export const rbacApi = {
  roles: () => apiFetch<Role[]>("/roles"),
  permissions: () => apiFetch<Permission[]>("/permissions"),
  setRolePermissions: (roleId: Id, permissionCodes: string[]) =>
    apiFetch<Role>(`/roles/${roleId}/permissions`, { method: "PUT", body: { permissionCodes } }),
  createRole: (body: CreateRoleRequest) => apiFetch<Role>("/roles", { method: "POST", body }),
  updateRole: (roleId: Id, body: UpdateRoleRequest) => apiFetch<Role>(`/roles/${roleId}`, { method: "PUT", body }),
  deleteRole: (roleId: Id) => apiFetch<void>(`/roles/${roleId}`, { method: "DELETE" }),
};
