import type { CurrentUser, UserRole } from "@/features/auth/types";

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

/** Role names by code (backend sends English); unknown / admin-created roles fall back to `roleName`. */
const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  TICKET_STAFF: "Nhân viên quầy",
  CINEMA_MANAGER: "Quản lý rạp",
  CONTENT_MANAGER: "Quản lý nội dung",
  ADMIN: "Quản trị hệ thống",
};

export function roleLabel(role: Pick<UserRole, "roleCode" | "roleName">): string {
  return ROLE_LABELS[role.roleCode] ?? role.roleName;
}

const PERMISSION_LABELS: Record<string, string> = {
  MOVIE_VIEW: "Xem phim, lịch chiếu, rạp",
  MOVIE_MANAGE: "Quản lý phim",
  GENRE_MANAGE: "Quản lý thể loại",
  BANNER_MANAGE: "Quản lý banner",
  REVIEW_MODERATE: "Kiểm duyệt đánh giá",
  CINEMA_MANAGE: "Quản lý cụm rạp",
  ROOM_MANAGE: "Quản lý phòng chiếu",
  SEAT_LAYOUT_MANAGE: "Thiết kế sơ đồ ghế",
  SEAT_BLOCK: "Khóa / mở ghế hỏng",
  SHOWTIME_MANAGE: "Quản lý suất chiếu",
  PRICE_MANAGE: "Quản lý giá vé",
  BOOKING_CREATE_ONLINE: "Đặt vé online",
  BOOKING_VIEW_OWN: "Xem vé của mình",
  BOOKING_VIEW_CINEMA: "Xem đặt vé của rạp",
  BOOKING_VIEW_ALL: "Xem tất cả đặt vé",
  BOOKING_COUNTER_SELL: "Bán vé tại quầy",
  TICKET_CHECKIN: "Check-in vé",
  REFUND_REQUEST: "Yêu cầu hoàn tiền",
  REFUND_APPROVE: "Duyệt hoàn tiền",
  VOUCHER_MANAGE_CINEMA: "Quản lý voucher của rạp",
  VOUCHER_MANAGE_GLOBAL: "Quản lý voucher toàn hệ thống",
  PRODUCT_MANAGE: "Quản lý bắp nước",
  REPORT_VIEW_CINEMA: "Xem báo cáo của rạp",
  REPORT_VIEW_ALL: "Xem báo cáo toàn hệ thống",
  USER_MANAGE: "Quản lý người dùng",
  ROLE_MANAGE: "Quản lý vai trò & quyền",
  STAFF_ASSIGN: "Gán nhân viên cho rạp",
  AUDIT_LOG_VIEW: "Xem audit log",
};

export function permissionLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code;
}
