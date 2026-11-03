/** Mirrors com.pnt.cinema.modules.promotion DTOs. Money is VND; instants are ISO UTC. */
export type DiscountType = "PERCENT" | "FIXED";
export type VoucherStatus = "ACTIVE" | "INACTIVE";
/** Derived by the backend from status, period and uses at response time. */
export type VoucherState = "INACTIVE" | "UPCOMING" | "RUNNING" | "ENDED" | "USED_UP";

export const VOUCHER_STATES: VoucherState[] = ["RUNNING", "UPCOMING", "USED_UP", "ENDED", "INACTIVE"];

/** Cinema name or movie title. */
export interface VoucherRef {
  id: number;
  name: string;
}

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  /** Percent (1–100) or amount. */
  discountValue: number;
  /** Cap of a PERCENT discount; null = no cap. */
  maxDiscount: number | null;
  minOrderValue: number;
  /** Null = unlimited. */
  usageLimit: number | null;
  usedCount: number;
  /** Uses per customer account; null = unlimited. */
  perUserLimit: number | null;
  /** Null = every cinema. */
  cinema: VoucherRef | null;
  /** Null = every movie. */
  movie: VoucherRef | null;
  startAt: string;
  /** Exclusive. */
  endAt: string;
  status: VoucherStatus;
  state: VoucherState;
  createdAt: string;
}

export interface VoucherRequest {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  cinemaId?: number;
  movieId?: number;
  startAt: string;
  endAt: string;
  status: VoucherStatus;
}

/** Without `cinemaId` / `globalOnly`: every voucher the user may manage. */
export interface VoucherFilter {
  keyword?: string;
  state?: VoucherState;
  cinemaId?: number;
  globalOnly?: boolean;
  page?: number;
  size?: number;
}

/** The voucher a booking used (its discount is the booking's `discountAmount`). */
export interface VoucherSummary {
  id: number;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
}

/** Counter check before taking the cash; the terms let the till recompute the discount as the order changes. */
export interface VoucherQuote {
  voucher: VoucherSummary;
  discount: number;
  maxDiscount: number | null;
  minOrderValue: number;
}
