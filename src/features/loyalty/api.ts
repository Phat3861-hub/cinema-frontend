import type { Booking } from "@/features/booking/types";
import type {
  CounterPointsQuoteRequest,
  LoyaltyAdjustRequest,
  LoyaltyBalance,
  LoyaltyQuote,
  LoyaltyTransaction,
} from "@/features/loyalty/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

type Id = number | string;
type PageQuery = { page?: number; size?: number };

/** Loyalty points (PRO-02): own balance / history, points on a pending booking, counter check, admin adjustments. */
export const loyaltyApi = {
  mine: () => apiFetch<LoyaltyBalance>("/loyalty/me"),
  myHistory: (query: PageQuery = {}) =>
    apiFetch<PageResponse<LoyaltyTransaction>>("/loyalty/me/transactions", { query: { ...query } }),
  /** Uses `points` on the pending booking (replacing the number it used); they come back if it ends unpaid. */
  usePoints: (bookingId: Id, points: number) =>
    apiFetch<Booking>(`/bookings/${bookingId}/points`, { method: "PUT", body: { points } }),
  removePoints: (bookingId: Id) => apiFetch<Booking>(`/bookings/${bookingId}/points`, { method: "DELETE" }),
  /** BOOKING_COUNTER_SELL: balance of the account with this email and the most points the order allows. */
  quote: (cinemaId: Id, body: CounterPointsQuoteRequest) =>
    apiFetch<LoyaltyQuote>(`/cinemas/${cinemaId}/counter-bookings/points-quote`, { method: "POST", body }),
  /** USER_MANAGE. */
  balanceOf: (userId: Id) => apiFetch<LoyaltyBalance>(`/users/${userId}/loyalty`),
  historyOf: (userId: Id, query: PageQuery = {}) =>
    apiFetch<PageResponse<LoyaltyTransaction>>(`/users/${userId}/loyalty/transactions`, { query: { ...query } }),
  adjust: (userId: Id, body: LoyaltyAdjustRequest) =>
    apiFetch<LoyaltyTransaction>(`/users/${userId}/loyalty/adjustments`, { method: "POST", body }),
};
