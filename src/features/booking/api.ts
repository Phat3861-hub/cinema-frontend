import type {
  Booking,
  BookingHoldRequest,
  BookingItemInput,
  BookingStatus,
  Product,
  ProductCategory,
  ProductRequest,
} from "@/features/booking/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

type Id = number | string;

/** Snack bar menu: public list of products on sale; management needs PRODUCT_MANAGE. */
export const productApi = {
  listOnSale: (category?: ProductCategory) => apiFetch<Product[]>("/products", { query: { category } }),
  listAll: () => apiFetch<Product[]>("/products/all"),
  create: (body: ProductRequest) => apiFetch<Product>("/products", { method: "POST", body }),
  update: (productId: Id, body: ProductRequest) => apiFetch<Product>(`/products/${productId}`, { method: "PUT", body }),
  remove: (productId: Id) => apiFetch<void>(`/products/${productId}`, { method: "DELETE" }),
};

/** Online booking: hold seats (PENDING with a countdown), pick snacks, cancel, history. */
export const bookingApi = {
  /**
   * Holds the seats for `app.booking.seat-hold-duration`. Replaces the user's previous pending booking of the
   * same showtime. A retry with the same `idempotencyKey` returns the first booking instead of holding again.
   */
  hold: (body: BookingHoldRequest, idempotencyKey: string) =>
    apiFetch<Booking>("/bookings", { method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
  /** Replaces the snacks of a pending booking (empty list = none). */
  replaceItems: (bookingId: Id, items: BookingItemInput[]) =>
    apiFetch<Booking>(`/bookings/${bookingId}/items`, { method: "PUT", body: { items } }),
  cancel: (bookingId: Id) => apiFetch<Booking>(`/bookings/${bookingId}/cancel`, { method: "PATCH" }),
  /** Own bookings, newest first. */
  mine: (query: { status?: BookingStatus; page?: number; size?: number } = {}) =>
    apiFetch<PageResponse<Booking>>("/bookings/me", { query }),
  get: (bookingId: Id) => apiFetch<Booking>(`/bookings/${bookingId}`),
};
