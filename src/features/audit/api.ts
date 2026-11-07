import type { AuditLog, AuditLogFilter } from "@/features/audit/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

/** `/api/v1/audit-logs` (AUDIT_LOG_VIEW): sensitive operations, newest first. */
export const auditApi = {
  search: (filter: AuditLogFilter) => apiFetch<PageResponse<AuditLog>>("/audit-logs", { query: { ...filter } }),
};
