"use client";

import { useLocale, useT } from "@/i18n";
import { addDays, dayParts, todayInVietnam } from "@/lib/format";

/** Next `days` days as `yyyy-MM-dd` (Vietnam time), used when the backend gives no explicit list. */
export function nextDays(days = 7): string[] {
  const today = todayInVietnam();
  return Array.from({ length: days }, (_, i) => addDays(today, i));
}

/** Ticketor "Time selection" day picker; days without showtimes are disabled when `available` is given. */
export function DateStrip({
  dates,
  value,
  onChange,
  available,
}: {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  available?: Set<string>;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const today = todayInVietnam();

  return (
    <div role="group" aria-label={t.showtime.pickDate} className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((date) => {
        const { weekday, day, month } = dayParts(date, intlLocale);
        const active = date === value;
        const disabled = available !== undefined && !available.has(date);
        return (
          <button
            key={date}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(date)}
            className={
              "flex w-16 shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-lg border py-2.5 transition-colors " +
              "focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 " +
              (active ? "border-primary bg-primary text-black" : "border-line bg-surface text-fg-2 hover:border-line-strong")
            }
          >
            <span className="text-xs font-semibold uppercase">{date === today ? t.showtime.today : weekday}</span>
            <span className="text-xl font-bold">{day}</span>
            <span className={`text-xs font-semibold ${active ? "text-black/70" : "text-fg-subtle"}`}>
              {t.showtime.monthShort(month)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
