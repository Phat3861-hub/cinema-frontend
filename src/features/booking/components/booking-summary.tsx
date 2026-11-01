import { Armchair, CalendarClock, Clapperboard, MapPin, Popcorn } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { ROUTES } from "@/constants/routes";
import type { BookingSeat } from "@/features/booking/types";
import { AgeBadge } from "@/features/movie/components/movie-badges";
import type { Showtime } from "@/features/showtime/types";
import { useLocale, useT } from "@/i18n";
import { formatDate, formatTime, formatVnd } from "@/lib/format";

export interface SummaryItem {
  productId: number;
  name: string;
  quantity: number;
  totalPrice: number;
}

/**
 * Right column of every booking step (Ticketor Seat Selection): movie, cinema, time, seats, snacks, total.
 * `top` holds the hold countdown, `children` the step's actions.
 */
export function BookingSummary({
  showtime,
  seatsTitle,
  seats,
  emptySeats,
  items = [],
  discount = 0,
  total,
  top,
  children,
}: {
  showtime: Showtime;
  seatsTitle: string;
  seats: BookingSeat[];
  emptySeats?: ReactNode;
  items?: SummaryItem[];
  discount?: number;
  total: number;
  top?: ReactNode;
  children: ReactNode;
}) {
  const t = useT();
  const { intlLocale } = useLocale();

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24" aria-label={t.booking.summary}>
      {top}
      <div className="flex gap-4">
        <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-3">
          <CoverImage src={showtime.movie.posterUrl} alt={showtime.movie.title} sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Link href={ROUTES.movieDetail(showtime.movie.slug)} className="text-h8 hover:text-accent">
            {showtime.movie.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <AgeBadge rating={showtime.movie.ageRating} />
            <span className="text-xs font-semibold text-fg-muted">
              {showtime.format} · {t.showtime.audio[showtime.audioType]}
            </span>
          </div>
        </div>
      </div>
      <dl className="flex flex-col gap-2.5 border-y border-line py-4 text-sm font-medium">
        <SummaryRow icon={MapPin} label={t.booking.cinema} value={showtime.cinema.name} />
        <SummaryRow icon={Clapperboard} label={t.booking.room} value={showtime.room.name} />
        <SummaryRow
          icon={CalendarClock}
          label={t.booking.time}
          value={`${formatTime(showtime.startTime, intlLocale)} · ${formatDate(showtime.startTime, intlLocale)}`}
        />
      </dl>

      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Armchair aria-hidden className="size-4" />
          {seatsTitle}
        </p>
        {seats.length === 0 ? (
          <p className="text-sm font-medium text-fg-muted">{emptySeats}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm font-medium" aria-live="polite">
            {seats.map((seat) => (
              <li key={seat.seatId} className="flex justify-between gap-3">
                <span>
                  {seat.seatCode} <span className="text-fg-muted">· {t.seat.type[seat.seatType]}</span>
                </span>
                <span className="font-semibold">{formatVnd(seat.price, intlLocale)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Popcorn aria-hidden className="size-4" />
            {t.booking.snacks}
          </p>
          <ul className="flex flex-col gap-1.5 text-sm font-medium" aria-live="polite">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.name} <span className="text-fg-muted">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatVnd(item.totalPrice, intlLocale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        {discount > 0 && (
          <p className="flex items-center justify-between text-sm font-semibold text-success">
            <span>{t.booking.discount}</span>
            <span>−{formatVnd(discount, intlLocale)}</span>
          </p>
        )}
        <p className="flex items-center justify-between">
          <span className="text-sm font-semibold text-fg-muted">{t.booking.total}</span>
          <span className="text-xl font-bold">{formatVnd(total, intlLocale)}</span>
        </p>
      </div>
      {children}
    </aside>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
      <dt className="sr-only">{label}</dt>
      <dd className="text-fg-2">{value}</dd>
    </div>
  );
}
