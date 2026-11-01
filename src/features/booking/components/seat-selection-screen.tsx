"use client";

import { Armchair, CalendarClock, Clapperboard, Info, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { AgeBadge } from "@/features/movie/components/movie-badges";
import { showtimeApi } from "@/features/showtime/api";
import { SeatLegend, SeatMap, type SeatVisual } from "@/features/showtime/components/seat-map";
import type { Showtime, ShowtimeSeat, ShowtimeSeatMap } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatTime, formatVnd } from "@/lib/format";

const MAX_SEATS = 8;
type Seat = ShowtimeSeat & { id: number };

/**
 * Seat step of the booking flow (Ticketor Seat Selection). Holding seats / paying needs the booking module
 * (backend not ready), so "Continue" is disabled with a notice; the map is a snapshot (reload to refresh).
 */
export function SeatSelectionScreen({ showtimeId }: { showtimeId: string }) {
  const t = useT();
  const showtime = useApi(`showtime:${showtimeId}`, () => showtimeApi.get(showtimeId));
  const seatMap = useApi(`seats:${showtimeId}`, () => showtimeApi.seats(showtimeId));

  const error = showtime.error ?? seatMap.error;
  if (error instanceof ApiError && error.code === "SHOWTIME_NOT_FOUND") notFound();
  if (error && !(showtime.data && seatMap.data)) {
    return <ErrorState error={error} onRetry={() => (showtime.reload(), seatMap.reload())} />;
  }
  if (!showtime.data || !seatMap.data) {
    return (
      <div className="mx-auto grid w-full max-w-[1232px] gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[480px] rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1232px] flex-col gap-6 px-4 py-6">
      <Steps />
      <h1 className="sr-only">{t.booking.seatTitle}</h1>
      <SeatStep showtime={showtime.data} seatMap={seatMap.data} onRefresh={seatMap.reload} />
    </div>
  );
}

function Steps() {
  const t = useT();
  const steps = [t.booking.stepSeats, t.booking.stepFood, t.booking.stepPayment, t.booking.stepTicket];
  return (
    <ol className="flex items-center gap-2 overflow-x-auto text-sm font-semibold" aria-label={t.booking.steps}>
      {steps.map((label, index) => (
        <li key={label} className="flex shrink-0 items-center gap-2">
          <span
            aria-current={index === 0 ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${index === 0 ? "bg-primary text-black" : "bg-surface-2 text-fg-muted"}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-xs">{index + 1}</span>
            {label}
          </span>
          {index < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-line-strong" />}
        </li>
      ))}
    </ol>
  );
}

function SeatStep({ showtime, seatMap, onRefresh }: { showtime: Showtime; seatMap: ShowtimeSeatMap; onRefresh: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [limitHit, setLimitHit] = useState(false);

  const seats: Seat[] = seatMap.seats.map((seat) => ({ ...seat, id: seat.seatId }));
  const byId = new Map(seats.map((seat) => [seat.id, seat]));
  const onSale = seatMap.showtimeStatus === "OPEN" && new Date(showtime.startTime) > new Date();

  function visual(seat: Seat): SeatVisual {
    if (selected.has(seat.id)) return "selected";
    if (seat.status === "BLOCKED") return "blocked";
    if (seat.status !== "AVAILABLE") return "taken";
    return "available";
  }

  function toggle(seat: Seat) {
    // A couple seat is always booked as a pair.
    const group = seat.pairedSeatId !== null ? [seat.id, seat.pairedSeatId] : [seat.id];
    const next = new Set(selected);
    if (group.every((id) => next.has(id))) group.forEach((id) => next.delete(id));
    else if (next.size + group.length > MAX_SEATS) return setLimitHit(true);
    else group.forEach((id) => next.add(id));
    setLimitHit(false);
    setSelected(next);
  }

  const chosen = [...selected].map((id) => byId.get(id)).filter((seat): seat is Seat => !!seat);
  chosen.sort((a, b) => a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true }));
  const total = chosen.reduce((sum, seat) => sum + Number(seat.price), 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        {!onSale && <Alert tone="warning">{t.booking.notOnSale}</Alert>}
        <SeatMap
          totalRows={seatMap.totalRows}
          totalColumns={seatMap.totalColumns}
          seats={seats}
          seatTypes={seatMap.seatTypes}
          visual={visual}
          onSeat={onSale ? toggle : undefined}
          isInteractive={(seat) => seat.status === "AVAILABLE"}
          seatLabel={(seat) =>
            t.seat.seatAria(seat.seatCode, t.seat.type[seat.seatType], formatVnd(seat.price, intlLocale), t.seat.status[seat.status])
          }
        />
        <SeatLegend
          seatTypes={seatMap.seatTypes}
          states={["available", "selected", "taken", "blocked"]}
          surcharge={(amount) => formatVnd(amount, intlLocale)}
        />
        <button
          type="button"
          onClick={onRefresh}
          className="w-fit cursor-pointer rounded text-xs font-semibold text-fg-muted underline-offset-2 hover:text-fg hover:underline"
        >
          {t.booking.refreshSeats}
        </button>
      </div>

      <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24" aria-label={t.booking.summary}>
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
            {t.booking.selectedSeats(chosen.length, MAX_SEATS)}
          </p>
          {chosen.length === 0 ? (
            <p className="text-sm font-medium text-fg-muted">{t.booking.pickSeats}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm font-medium" aria-live="polite">
              {chosen.map((seat) => (
                <li key={seat.id} className="flex justify-between gap-3">
                  <span>
                    {seat.seatCode} <span className="text-fg-muted">· {t.seat.type[seat.seatType]}</span>
                  </span>
                  <span className="font-semibold">{formatVnd(seat.price, intlLocale)}</span>
                </li>
              ))}
            </ul>
          )}
          {limitHit && <p role="alert" className="text-xs font-semibold text-danger">{t.booking.maxSeats(MAX_SEATS)}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-fg-muted">{t.booking.total}</span>
          <span className="text-xl font-bold">{formatVnd(total, intlLocale)}</span>
        </div>
        <Button fullWidth disabled>
          {t.booking.continue}
        </Button>
        <p className="flex gap-2 text-xs font-medium text-fg-muted">
          <Info aria-hidden className="size-4 shrink-0" />
          {t.booking.comingSoon}
        </p>
        <Link href={ROUTES.movieDetail(showtime.movie.slug)} className={buttonClasses({ variant: "ghost", size: "md" })}>
          {t.booking.otherShowtimes}
        </Link>
      </aside>
    </div>
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
