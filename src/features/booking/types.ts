import type { SeatTypeCode } from "@/features/cinema/types";
import type { Showtime } from "@/features/showtime/types";

/** Mirrors com.pnt.cinema.modules.booking DTOs. Money is VND; instants are ISO UTC. */
export type ProductCategory = "POPCORN" | "DRINK" | "SNACK" | "COMBO";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
export type BookingChannel = "ONLINE" | "COUNTER";
export type TicketStatus = "VALID" | "USED" | "CANCELLED" | "REFUNDED";

export const BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "PENDING", "CANCELLED", "EXPIRED", "REFUNDED"];
export const BOOKING_CHANNELS: BookingChannel[] = ["COUNTER", "ONLINE"];

export const PRODUCT_CATEGORIES: ProductCategory[] = ["COMBO", "POPCORN", "DRINK", "SNACK"];

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  description: string | null;
  imageUrl: string | null;
  price: number;
  /** On sale (shown on the menu). */
  active: boolean;
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  category: ProductCategory;
  description?: string;
  imageUrl?: string;
  price: number;
  active: boolean;
}

export interface BookingSeat {
  /** Room seat id (same id as on the seat map). */
  seatId: number;
  seatCode: string;
  seatType: SeatTypeCode;
  price: number;
}

export interface BookingItem {
  productId: number;
  name: string;
  category: ProductCategory;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** Issued when a booking is confirmed; `qrToken` is the value to encode in the QR code. */
export interface BookingTicket {
  id: number;
  ticketCode: string;
  seatCode: string;
  price: number;
  status: TicketStatus;
  qrToken: string;
  checkedInAt: string | null;
}

/** Details typed in at the counter, completed from the customer's account (`userId` null = no account). */
export interface BookingCustomer {
  userId: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface BookingSeller {
  id: number;
  fullName: string;
  email: string;
}

export interface Booking {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  channel: BookingChannel;
  /** Null when the showtime is no longer visible (e.g. its cinema was removed). */
  showtime: Showtime | null;
  /** Seats held or bought; empty once an unpaid booking expired or was cancelled. */
  seats: BookingSeat[];
  items: BookingItem[];
  /** One per seat once CONFIRMED. */
  tickets: BookingTicket[];
  /** Null for an anonymous counter sale. */
  customer: BookingCustomer | null;
  /** Staff member of a counter sale (null online). */
  soldBy: BookingSeller | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  /** End of the seat hold while PENDING. */
  expiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface BookingHoldRequest {
  showtimeId: number;
  seatIds: number[];
}

export interface BookingItemInput {
  productId: number;
  quantity: number;
}

/** BOK-09: cash sale at the counter, confirmed at once. Customer details are optional. */
export interface CounterBookingRequest {
  showtimeId: number;
  seatIds: number[];
  items: BookingItemInput[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

/** Days are showtime days (Vietnam); `code` / `showtimeId` replace the date range. */
export interface CinemaBookingFilter {
  from?: string;
  to?: string;
  showtimeId?: number;
  status?: BookingStatus;
  channel?: BookingChannel;
  keyword?: string;
  code?: string;
  page?: number;
  size?: number;
}
