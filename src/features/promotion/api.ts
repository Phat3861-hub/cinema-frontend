import type {
  Banner,
  BannerFilter,
  BannerRequest,
  BannerStatus,
  PublicBanner,
  PublicVoucher,
  Voucher,
  VoucherFilter,
  VoucherRequest,
  VoucherStatus,
} from "@/features/promotion/types";
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
  /** Public vouchers usable now, ending soonest first (no token needed). */
  listPublic: () => apiFetch<PublicVoucher[]>("/vouchers/public"),
  create: (body: VoucherRequest) => apiFetch<Voucher>("/vouchers", { method: "POST", body }),
  /** Once used, only name, description, end time, limits and status may change (`VOUCHER_TERMS_LOCKED`). */
  update: (voucherId: Id, body: VoucherRequest) => apiFetch<Voucher>(`/vouchers/${voucherId}`, { method: "PUT", body }),
  changeStatus: (voucherId: Id, status: VoucherStatus) =>
    apiFetch<Voucher>(`/vouchers/${voucherId}/status`, { method: "PATCH", body: { status } }),
  /** Only a voucher that was never used (`VOUCHER_IN_USE` otherwise). */
  remove: (voucherId: Id) => apiFetch<void>(`/vouchers/${voucherId}`, { method: "DELETE" }),
};

/** Home page banners; management needs BANNER_MANAGE. */
export const bannerApi = {
  /** Banners showing now in home page order, at most 10 (no token needed). */
  listShowing: () => apiFetch<PublicBanner[]>("/banners"),
  /** Every banner in home page order (not paged, so it can be reordered). */
  list: (filter: BannerFilter) => apiFetch<Banner[]>("/banners/all", { query: { ...filter } }),
  /** Added at the end of the order. */
  create: (body: BannerRequest) => apiFetch<Banner>("/banners", { method: "POST", body }),
  update: (bannerId: Id, body: BannerRequest) => apiFetch<Banner>(`/banners/${bannerId}`, { method: "PUT", body }),
  changeStatus: (bannerId: Id, status: BannerStatus) =>
    apiFetch<Banner>(`/banners/${bannerId}/status`, { method: "PATCH", body: { status } }),
  /** `ids` must list every banner exactly once. */
  reorder: (ids: number[]) => apiFetch<Banner[]>("/banners/order", { method: "PUT", body: { ids } }),
  remove: (bannerId: Id) => apiFetch<void>(`/banners/${bannerId}`, { method: "DELETE" }),
};
