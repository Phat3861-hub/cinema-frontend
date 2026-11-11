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
  /** Loyalty points the booking credited; only on BOOKING_CONFIRMED and only when above 0. */
  pointsEarned?: number;
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

/** One row of `GET /notifications/me/preferences`. `optional = false`: always delivered, cannot be turned off. */
export interface NotificationPreference {
  type: NotificationType;
  optional: boolean;
  /** Whether this type is emailed at all (REVIEW_HIDDEN is in-app only). */
  emailAvailable: boolean;
  email: boolean;
  inApp: boolean;
}

/** `emailUnsubscribed`: my address opted out of every optional email; it overrides the per-type `email` flags. */
export interface NotificationPreferences {
  emailUnsubscribed: boolean;
  types: NotificationPreference[];
}

/** Body of `PUT /notifications/me/preferences`: only what is sent changes. */
export interface PreferencesUpdate {
  emailUnsubscribed?: boolean;
  types?: Pick<NotificationPreference, "type" | "email" | "inApp">[];
}

/** Result of the unsubscribe link; `email` is masked (`c***@example.com`). */
export interface EmailSubscription {
  email: string;
  unsubscribed: boolean;
}
