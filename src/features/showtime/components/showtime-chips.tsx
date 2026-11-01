"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { Showtime } from "@/features/showtime/types";
import { useLocale, useT } from "@/i18n";
import { formatTime } from "@/lib/format";

/** Group key "2D · Phụ đề" so the showtimes of one cinema are listed per format + audio (Ticketor style). */
export function groupByVersion(showtimes: Showtime[]): [string, Showtime[]][] {
  const groups = new Map<string, Showtime[]>();
  for (const showtime of showtimes) {
    const key = `${showtime.format}|${showtime.audioType}`;
    groups.set(key, [...(groups.get(key) ?? []), showtime]);
  }
  return [...groups.entries()];
}

/** Time buttons of one cinema; sold-out showtimes are not clickable. Clicking opens the seat map. */
export function ShowtimeChips({ showtimes }: { showtimes: Showtime[] }) {
  const t = useT();
  const { intlLocale } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      {groupByVersion(showtimes).map(([key, items]) => {
        const [format, audio] = key.split("|") as [Showtime["format"], Showtime["audioType"]];
        return (
          <div key={key} className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-wide text-fg-muted uppercase">
              {format} · {t.showtime.audio[audio]}
            </p>
            <ul className="flex flex-wrap gap-2">
              {items.map((showtime) => {
                const soldOut = showtime.availableSeats <= 0;
                const label = formatTime(showtime.startTime, intlLocale);
                return (
                  <li key={showtime.id}>
                    {soldOut ? (
                      <span
                        aria-disabled
                        className="flex min-w-20 flex-col items-center rounded border border-line px-3 py-2 opacity-50"
                      >
                        <span className="text-sm font-bold text-fg-muted line-through">{label}</span>
                        <span className="text-[11px] font-semibold text-fg-subtle">{t.showtime.soldOut}</span>
                      </span>
                    ) : (
                      <Link
                        href={ROUTES.booking(showtime.id)}
                        aria-label={t.showtime.chipLabel(label, showtime.room.name, showtime.availableSeats)}
                        className="flex min-w-20 flex-col items-center rounded border border-line-strong bg-surface-2 px-3 py-2 transition-colors hover:border-primary hover:bg-primary hover:text-black focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <span className="text-sm font-bold">{label}</span>
                        <span className="text-[11px] font-semibold opacity-75">
                          {t.showtime.seatsLeft(showtime.availableSeats)}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
