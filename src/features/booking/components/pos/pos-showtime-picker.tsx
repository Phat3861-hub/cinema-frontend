"use client";

import { CalendarX2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { DateStrip, nextDays } from "@/features/showtime/components/date-strip";
import { showtimeApi } from "@/features/showtime/api";
import type { Showtime } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { formatTime, todayInVietnam } from "@/lib/format";

/** Days the counter can sell ahead. */
const SALE_DAYS = 7;

/**
 * POS step 1: the cinema's showtimes still on sale for a day, grouped by movie, as large touch targets
 * (time, room, format, seats left). Sold-out showtimes stay visible but disabled.
 */
export function PosShowtimePicker({ cinemaId, onPick }: { cinemaId: number; onPick: (showtime: Showtime) => void }) {
  const t = useT();
  const [date, setDate] = useState(todayInVietnam);
  const dates = useApi(`pos-dates:${cinemaId}`, () => showtimeApi.dates({ cinemaId }));
  const showtimes = useApi(`pos-showtimes:${cinemaId}:${date}`, () => showtimeApi.list({ cinemaId, date }));

  const byMovie = new Map<number, Showtime[]>();
  for (const showtime of [...(showtimes.data ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    byMovie.set(showtime.movie.id, [...(byMovie.get(showtime.movie.id) ?? []), showtime]);
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="pos-pick-title">
      <div className="flex flex-col gap-1">
        <h2 id="pos-pick-title" className="text-h6">
          {t.admin.pos.pickShowtime}
        </h2>
        <p className="text-sm font-medium text-fg-muted">{t.admin.pos.pickShowtimeHint}</p>
      </div>
      <DateStrip
        dates={nextDays(SALE_DAYS)}
        value={date}
        onChange={setDate}
        available={dates.data ? new Set(dates.data) : undefined}
      />

      {showtimes.error && !showtimes.data ? (
        <ErrorState error={showtimes.error} onRetry={showtimes.reload} />
      ) : !showtimes.data ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : byMovie.size === 0 ? (
        <EmptyState icon={CalendarX2} title={t.admin.pos.noShowtimes} description={t.admin.pos.noShowtimesHint} />
      ) : (
        <ul className="flex flex-col gap-3">
          {[...byMovie.values()].map((group) => (
            <MovieRow key={group[0].movie.id} showtimes={group} onPick={onPick} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MovieRow({ showtimes, onPick }: { showtimes: Showtime[]; onPick: (showtime: Showtime) => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const movie = showtimes[0].movie;

  return (
    <li className="flex gap-4 rounded-xl border border-line bg-surface-2 p-3 sm:p-4">
      <div className="relative hidden aspect-[2/3] w-20 shrink-0 self-start overflow-hidden rounded-lg bg-surface-3 sm:block">
        <CoverImage src={movie.posterUrl} alt={movie.title} sizes="80px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-h8">{movie.title}</h3>
          <Badge tone="warning">{movie.ageRating}</Badge>
          <span className="text-xs font-semibold text-fg-muted">{t.common.minutes(movie.durationMinutes)}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
          {showtimes.map((showtime) => {
            const soldOut = showtime.availableSeats === 0;
            return (
              <button
                key={showtime.id}
                type="button"
                disabled={soldOut}
                onClick={() => onPick(showtime)}
                className={
                  "flex min-h-20 cursor-pointer flex-col items-start justify-between gap-1 rounded-xl border-2 border-line bg-surface p-3 text-left " +
                  "transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                  "active:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                }
              >
                <span className="text-2xl font-bold">{formatTime(showtime.startTime, intlLocale)}</span>
                <span className="text-xs font-semibold text-fg-muted">
                  {showtime.room.name} · {showtime.format} · {t.showtime.audio[showtime.audioType]}
                </span>
                <span className={`text-xs font-bold ${soldOut ? "text-danger" : "text-success"}`}>
                  {soldOut ? t.admin.pos.soldOut : t.admin.pos.seatsLeft(showtime.availableSeats, showtime.totalSeats)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}
