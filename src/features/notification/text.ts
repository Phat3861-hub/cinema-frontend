import { ROUTES } from "@/constants/routes";
import type { AppNotification } from "@/features/notification/types";
import type { Messages } from "@/i18n";
import { formatDateTime } from "@/lib/format";

/** Title + body in the UI language, built from `type` + `data` (the stored `title` / `content` are English). */
export function notificationText(n: AppNotification, t: Messages, intlLocale: string): { title: string; body: string } {
  const texts = t.notifications.types;
  if (n.type === "REVIEW_HIDDEN") {
    const reason = n.data.reason ? t.reviews.hiddenReason[n.data.reason] : null;
    return {
      title: texts.REVIEW_HIDDEN.title,
      body: texts.REVIEW_HIDDEN.body(n.data.movieTitle, reason, n.data.note),
    };
  }
  if (n.type === "MOVIE_ON_SALE") {
    return {
      title: texts.MOVIE_ON_SALE.title,
      body: texts.MOVIE_ON_SALE.body(n.data.movieTitle, formatDateTime(n.data.firstStartTime, intlLocale)),
    };
  }
  const d = n.data;
  const booking = {
    code: d.bookingCode,
    movie: d.movieTitle,
    time: formatDateTime(d.startTime, intlLocale),
    place: `${d.cinemaName}, ${d.roomName}`,
    seats: d.seats.join(", "),
  };
  const earned = n.type === "BOOKING_CONFIRMED" && d.pointsEarned ? ` ${t.notifications.pointsEarned(d.pointsEarned)}` : "";
  return { title: texts[n.type].title, body: texts[n.type].body(booking) + earned };
}

/** Where a click on the notification leads. */
export function notificationHref(n: AppNotification): string {
  if (n.type === "REVIEW_HIDDEN") return `${ROUTES.movieDetail(n.data.movieSlug)}#reviews`;
  if (n.type === "MOVIE_ON_SALE") return `${ROUTES.movieDetail(n.data.movieSlug)}#showtimes`;
  return ROUTES.myTicket(n.data.bookingId);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
];

/** "5 phút trước" / "5 minutes ago" up to a week, then the date. */
export function relativeTime(value: string, now: number, intlLocale: string, justNow: string): string {
  let amount = Math.round((now - Date.parse(value)) / 60_000);
  if (amount < 1) return justNow;
  const format = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });
  for (const [unit, next] of UNITS) {
    if (amount < next) return format.format(-amount, unit);
    amount = Math.floor(amount / next);
  }
  return formatDateTime(value, intlLocale);
}
