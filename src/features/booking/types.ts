import type { SeatTypeCode } from "@/features/cinema/types";
import type { Showtime } from "@/features/showtime/types";

/** Mirrors com.pnt.cinema.modules.booking DTOs. Money is VND; instants are ISO UTC. */
export type ProductCategory = "POPCORN" | "DRINK" | "SNACK" | "COMBO";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
export type BookingChannel = "ONLINE" | "COUNTER";

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
