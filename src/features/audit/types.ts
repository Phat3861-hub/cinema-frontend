/** Mirrors com.pnt.cinema.modules.audit.entity.AuditEntityType. */
export type AuditEntityType = "USER" | "ROLE" | "MOVIE" | "CINEMA" | "ROOM" | "SHOWTIME" | "REVIEW" | "VOUCHER";

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = ["USER", "ROLE", "MOVIE", "CINEMA", "ROOM", "SHOWTIME", "REVIEW", "VOUCHER"];

/** Mirrors AuditAction, grouped by the kind of record it is about (order of the action filter). */
export const AUDIT_ACTIONS = {
  USER: ["USER_LOCK", "USER_UNLOCK", "ROLE_ASSIGN", "ROLE_REMOVE", "LOYALTY_ADJUST"],
  ROLE: ["ROLE_CREATE", "ROLE_UPDATE", "ROLE_DELETE", "ROLE_PERMISSIONS_UPDATE"],
  MOVIE: ["MOVIE_DELETE"],
  CINEMA: ["CINEMA_DELETE"],
  ROOM: ["ROOM_DELETE"],
  SHOWTIME: ["SHOWTIME_UPDATE", "SHOWTIME_CANCEL"],
  REVIEW: ["REVIEW_HIDE", "REVIEW_SHOW"],
  VOUCHER: ["VOUCHER_UPDATE", "VOUCHER_STATUS_CHANGE", "VOUCHER_DELETE"],
} as const satisfies Record<AuditEntityType, readonly string[]>;

export type AuditAction = (typeof AUDIT_ACTIONS)[AuditEntityType][number];

/** Changed fields only; values are whatever the backend stored (strings, numbers, booleans, lists, null). */
export type AuditValues = Record<string, unknown>;

/** Mirrors AuditLogResponse; `actor` is null when the system acted. */
export interface AuditLog {
  id: number;
  actor: { id: number; fullName: string | null; email: string | null } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: AuditValues | null;
  newValue: AuditValues | null;
  ipAddress: string | null;
  traceId: string | null;
  createdAt: string;
}

/** Query of `GET /audit-logs`; days are `yyyy-MM-dd` in Vietnam time. */
export interface AuditLogFilter {
  from?: string;
  to?: string;
  actorId?: number;
  actorEmail?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  page?: number;
  size?: number;
}
