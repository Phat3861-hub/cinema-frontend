import type { ReportCinema, ReportDay, ReportFilter, ReportMovie, ReportProducts, ReportSummary } from "@/features/report/types";
import { apiFetch } from "@/lib/api-client";

/** `/api/v1/reports` (SYS-03): REPORT_VIEW_ALL for every cinema, REPORT_VIEW_CINEMA for its own one at a time. */
export const reportApi = {
  summary: (filter: ReportFilter) => apiFetch<ReportSummary>("/reports/summary", { query: { ...filter } }),
  daily: (filter: ReportFilter) => apiFetch<ReportDay[]>("/reports/daily", { query: { ...filter } }),
  movies: (filter: ReportFilter, limit = 10) => apiFetch<ReportMovie[]>("/reports/movies", { query: { ...filter, limit } }),
  /** Only with REPORT_VIEW_ALL. */
  cinemas: (filter: Pick<ReportFilter, "from" | "to">) => apiFetch<ReportCinema[]>("/reports/cinemas", { query: { ...filter } }),
  products: (filter: ReportFilter) => apiFetch<ReportProducts>("/reports/products", { query: { ...filter } }),
};
