import type { CurrentUser } from "@/features/auth/types";
import type { Messages } from "@/i18n/messages/vi";

/**
 * Permissions that open at least one admin menu (docs/ui-design.md §5.2). A user with none of them
 * (e.g. CUSTOMER) stays on the customer site. The backend still enforces every permission.
 */
const ADMIN_PERMISSIONS = new Set([
  "REPORT_VIEW_ALL",
  "REPORT_VIEW_CINEMA",
  "BOOKING_COUNTER_SELL",
  "TICKET_CHECKIN",
  "BOOKING_VIEW_CINEMA",
  "BOOKING_VIEW_ALL",
  "REFUND_APPROVE",
  "MOVIE_MANAGE",
  "GENRE_MANAGE",
  "BANNER_MANAGE",
  "REVIEW_MODERATE",
  "CINEMA_MANAGE",
  "ROOM_MANAGE",
  "SEAT_LAYOUT_MANAGE",
  "SEAT_BLOCK",
  "SHOWTIME_MANAGE",
  "PRICE_MANAGE",
  "STAFF_ASSIGN",
  "VOUCHER_MANAGE_GLOBAL",
  "VOUCHER_MANAGE_CINEMA",
  "PRODUCT_MANAGE",
  "USER_MANAGE",
  "ROLE_MANAGE",
  "AUDIT_LOG_VIEW",
]);

export function hasAdminAccess(user: CurrentUser | null): boolean {
  return !!user?.permissions.some((permission) => ADMIN_PERMISSIONS.has(permission));
}

/** True when the user holds at least one of `permissions` (UI hint only – the backend decides). */
export function hasAny(user: CurrentUser | null, permissions: readonly string[]): boolean {
  return !!user && permissions.some((permission) => user.permissions.includes(permission));
}

/** Role name by code (backend sends English); unknown / admin-created roles fall back to the backend name. */
export function roleLabel(role: { roleCode?: string; code?: string; roleName?: string; name?: string }, t: Messages) {
  const code = role.roleCode ?? role.code ?? "";
  const labels: Record<string, string> = t.roles;
  return labels[code] ?? role.roleName ?? role.name ?? code;
}

export function permissionLabel(code: string, t: Messages): string {
  const labels: Record<string, string> = t.permissions;
  return labels[code] ?? code;
}
