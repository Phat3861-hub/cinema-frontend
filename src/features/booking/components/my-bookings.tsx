"use client";

import { Armchair, CalendarClock, MapPin, Popcorn, Star, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { bookingApi } from "@/features/booking/api";
import type { Booking, BookingStatus } from "@/features/booking/types";
import { useApi } from "@/hooks/use-api";
import { useNow } from "@/hooks/use-now";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDateTime, formatTime, formatVnd } from "@/lib/format";

type Tab = "upcoming" | "watched" | "cancelled";

/** A customer rarely has more; the backend caps a page at 100. */
const HISTORY_SIZE = 100;

export const BOOKING_STATUS_TONES: Record<BookingStatus, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REFUNDED: "info",
};

/** A pending booking whose hold already ended shows as expired until the backend job closes it. */
function displayStatus(booking: Booking, now: number): BookingStatus {
  if (booking.status === "PENDING" && booking.expiresAt && Date.parse(booking.expiresAt) <= now) return "EXPIRED";
  return booking.status;
}

function tabOf(booking: Booking, now: number): Tab {
  const status = displayStatus(booking, now);
  if (status === "PENDING") return "upcoming";
  if (status !== "CONFIRMED") return "cancelled";
  return booking.showtime && Date.parse(booking.showtime.endTime) > now ? "upcoming" : "watched";
}

/** "My tickets" (docs/ui-design.md §4.3): tabs Upcoming / Watched / Cancelled over the booking history. */
export function MyBookings() {
  const t = useT();
  const toast = useToast();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const history = useApi("bookings:me", () => bookingApi.mine({ size: HISTORY_SIZE }));

  const all = history.data?.content ?? [];
  const byTab: Record<Tab, Booking[]> = { upcoming: [], watched: [], cancelled: [] };
  for (const booking of all) byTab[tabOf(booking, now)].push(booking);
  // Soonest showtime first; the other tabs stay newest first.
  byTab.upcoming.sort((a, b) => (a.showtime?.startTime ?? "").localeCompare(b.showtime?.startTime ?? ""));

  async function confirmCancel() {
    if (!toCancel) return;
    setCancelling(true);
    try {
      const cancelled = await bookingApi.cancel(toCancel.id);
      history.setData((page) => page && { ...page, content: page.content.map((b) => (b.id === cancelled.id ? cancelled : b)) });
      toast.success(t.booking.cancelled);
      setToCancel(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
      history.reload();
    } finally {
      setCancelling(false);
    }
  }

  const list = byTab[tab];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="tickets-title">
      <h1 id="tickets-title" className="text-h6">
        {t.nav.myTickets}
      </h1>
      <Tabs
        label={t.account.tickets.tabs}
        value={tab}
        onChange={setTab}
        items={[
          { value: "upcoming", label: t.account.tickets.upcoming, count: history.data ? byTab.upcoming.length : undefined },
          { value: "watched", label: t.account.tickets.watched, count: history.data ? byTab.watched.length : undefined },
          { value: "cancelled", label: t.account.tickets.cancelled, count: history.data ? byTab.cancelled.length : undefined },
        ]}
      />

      {history.error && !history.data ? (
        <ErrorState error={history.error} onRetry={history.reload} />
      ) : !history.data ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t.account.tickets.empty[tab]}
          description={tab === "upcoming" ? t.account.tickets.emptyHint : undefined}
          action={
            tab === "upcoming" ? (
              <Link href={ROUTES.movies} className={buttonClasses({ size: "md" })}>
                {t.home.browseMovies}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((booking) => (
            <BookingCard key={booking.id} booking={booking} now={now} onCancel={() => setToCancel(booking)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title={t.booking.cancelTitle}
        description={t.booking.cancelText}
        confirmLabel={t.booking.cancelBooking}
      />
    </section>
  );
}

function BookingCard({ booking, now, onCancel }: { booking: Booking; now: number; onCancel: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const status = displayStatus(booking, now);
  const showtime = booking.showtime;
  const seatCodes = booking.seats.map((seat) => seat.seatCode).join(", ");
  const watched = tabOf(booking, now) === "watched";

  return (
    <li className="flex gap-4 rounded-xl border border-line bg-surface-2 p-3 sm:p-4">
      <div className="relative aspect-[2/3] w-16 shrink-0 self-start overflow-hidden rounded-lg bg-surface-3 sm:w-20">
        <CoverImage src={showtime?.movie.posterUrl} alt={showtime?.movie.title ?? ""} sizes="80px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {showtime ? (
              <Link href={ROUTES.movieDetail(showtime.movie.slug)} className="text-h8 hover:text-accent">
                {showtime.movie.title}
              </Link>
            ) : (
              <p className="text-h8 text-fg-muted">{t.account.tickets.showtimeGone}</p>
            )}
            <p className="text-xs font-medium text-fg-muted">
              {t.booking.bookingCode}: <span className="font-mono font-bold text-fg-2">{booking.bookingCode}</span>
            </p>
          </div>
          <Badge tone={BOOKING_STATUS_TONES[status]}>{t.booking.status[status]}</Badge>
        </div>

        <dl className="grid gap-1.5 text-sm font-medium text-fg-2 sm:grid-cols-2">
          {showtime && (
            <>
              <InfoRow icon={CalendarClock} label={t.booking.time} value={formatDateTime(showtime.startTime, intlLocale)} />
              <InfoRow icon={MapPin} label={t.booking.cinema} value={`${showtime.cinema.name} · ${showtime.room.name}`} />
            </>
          )}
          {seatCodes && <InfoRow icon={Armchair} label={t.booking.seats} value={seatCodes} />}
          {booking.items.length > 0 && (
            <InfoRow
              icon={Popcorn}
              label={t.booking.snacks}
              value={booking.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
            />
          )}
        </dl>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm font-semibold text-fg-muted">
            {t.booking.totalToPay}: <span className="text-base font-bold text-fg">{formatVnd(booking.totalAmount, intlLocale)}</span>
          </p>
          {(booking.tickets.length > 0 || (watched && showtime)) && (
            <div className="flex flex-wrap items-center gap-2">
              {watched && showtime && (
                <Link
                  href={`${ROUTES.movieDetail(showtime.movie.slug)}#reviews`}
                  aria-label={t.account.tickets.reviewItem(showtime.movie.title)}
                  className={buttonClasses({ size: "sm" })}
                >
                  <Star aria-hidden className="size-4" />
                  {t.account.tickets.review}
                </Link>
              )}
              {booking.tickets.length > 0 && (
                <Link href={ROUTES.myTicket(booking.id)} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  <Ticket aria-hidden className="size-4" />
                  {t.account.tickets.viewTickets(booking.tickets.length)}
                </Link>
              )}
            </div>
          )}
          {status === "PENDING" && (
            <div className="flex flex-wrap items-center gap-3">
              {booking.expiresAt && (
                <span className="text-xs font-semibold text-warning">
                  {t.account.tickets.heldUntil(formatTime(booking.expiresAt, intlLocale))}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={onCancel}>
                {t.booking.cancelBooking}
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
