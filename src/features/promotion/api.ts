import type { Voucher, VoucherFilter, VoucherRequest, VoucherStatus } from "@/features/promotion/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

type Id = number | string;

/**
 * Staff management of vouchers: system-wide ones need VOUCHER_MANAGE_GLOBAL, a cinema's ones either that or
 * VOUCHER_MANAGE_CINEMA for the cinema (checked by the backend).
 */
export const voucherApi = {
  /** Newest first. */
  list: (filter: VoucherFilter) => apiFetch<PageResponse<Voucher>>("/vouchers", { query: { ...filter } }),
  create: (body: VoucherRequest) => apiFetch<Voucher>("/vouchers", { method: "POST", body }),
  /** Once used, only name, description, end time, limits and status may change (`VOUCHER_TERMS_LOCKED`). */
  update: (voucherId: Id, body: VoucherRequest) => apiFetch<Voucher>(`/vouchers/${voucherId}`, { method: "PUT", body }),
  changeStatus: (voucherId: Id, status: VoucherStatus) =>
    apiFetch<Voucher>(`/vouchers/${voucherId}/status`, { method: "PATCH", body: { status } }),
  /** Only a voucher that was never used (`VOUCHER_IN_USE` otherwise). */
  remove: (voucherId: Id) => apiFetch<void>(`/vouchers/${voucherId}`, { method: "DELETE" }),
};
