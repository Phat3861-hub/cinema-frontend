/** Mirrors com.pnt.cinema.modules.notification.entity.NotificationType. */
export type NotificationType = "BOOKING_CONFIRMED" | "SHOWTIME_CANCELLED" | "SHOWTIME_REMINDER" | "REVIEW_HIDDEN";

/** `data` of the booking notifications (`startTime` is an ISO instant). */
export interface BookingNotificationData {
  bookingId: number;
  bookingCode: string;
  showtimeId: number;
  movieTitle: string;
  movieSlug: string;
  cinemaName: string;
  roomName: string;
  startTime: string;
  seats: string[];
}

/** `data` of REVIEW_HIDDEN. */
export interface ReviewHiddenData {
  reviewId: number;
  movieId: number;
  movieTitle: string;
  movieSlug: string;
  reason: "SPOILER" | "OFFENSIVE" | "SPAM" | "OTHER" | null;
  note: string | null;
}

interface Base {
  id: number;
  /** English fallback; the UI renders its own text from `type` + `data`. */
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

/** Mirrors NotificationResponse, narrowed by `type`. */
export type AppNotification =
  | (Base & { type: "BOOKING_CONFIRMED" | "SHOWTIME_CANCELLED" | "SHOWTIME_REMINDER"; data: BookingNotificationData })
  | (Base & { type: "REVIEW_HIDDEN"; data: ReviewHiddenData });
