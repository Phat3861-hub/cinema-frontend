"use client";

import { CalendarX, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { cinemaApi } from "@/features/cinema/api";
import { ROOM_TYPES, type RoomType } from "@/features/cinema/types";
import type { Movie } from "@/features/movie/types";
import { showtimeApi } from "@/features/showtime/api";
import { DateStrip } from "@/features/showtime/components/date-strip";
import { ShowtimeChips } from "@/features/showtime/components/showtime-chips";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";

const MAX_DAYS = 14;

/** MOV-03 on the movie page: day strip, city + format filters, showtimes grouped by cinema. */
export function MovieShowtimes({ movie }: { movie: Movie }) {
  const t = useT();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [format, setFormat] = useState<RoomType | "">("");

  const dates = useApi(`dates:movie:${movie.id}`, () => showtimeApi.dates({ movieId: movie.id }));
  const cities = useApi("cities", cinemaApi.cities);
  const available = dates.data?.slice(0, MAX_DAYS) ?? [];
  const date = pickedDate ?? available[0] ?? null;

  const schedule = useApi(date ? `movie-showtimes:${movie.id}:${date}:${city}` : null, () =>
    showtimeApi.byMovie(movie.id, { date: date ?? undefined, city: city || undefined }),
  );

  const groups = (schedule.data ?? [])
    .map((group) => ({
      ...group,
      showtimes: format ? group.showtimes.filter((s) => s.format === format) : group.showtimes,
    }))
    .filter((group) => group.showtimes.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h6">{t.showtime.title}</h2>
        <p className="text-sm font-medium text-fg-muted">{t.showtime.subtitle}</p>
      </div>

      {dates.error && !dates.data ? (
        <ErrorState error={dates.error} onRetry={dates.reload} />
      ) : dates.loading && !dates.data ? (
        <Skeleton className="h-20 w-full" />
      ) : available.length === 0 ? (
        <EmptyState icon={CalendarX} title={t.showtime.noDates} description={t.showtime.noDatesHint} />
      ) : (
        <>
          <DateStrip dates={available} value={date ?? ""} onChange={setPickedDate} />
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[480px]">
            <Select aria-label={t.cinema.city} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">{t.cinema.allCities}</option>
              {cities.data?.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select aria-label={t.showtime.format} value={format} onChange={(e) => setFormat(e.target.value as RoomType | "")}>
              <option value="">{t.showtime.allFormats}</option>
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          {schedule.error && !schedule.data ? (
            <ErrorState error={schedule.error} onRetry={schedule.reload} />
          ) : schedule.loading && !schedule.data ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState icon={CalendarX} title={t.showtime.noneForFilter} />
          ) : (
            <ul className={`flex flex-col gap-4 ${schedule.loading ? "opacity-60" : ""}`}>
              {groups.map(({ cinema, showtimes }) => (
                <li key={cinema.id} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <Link
                      href={ROUTES.cinemaDetail(cinema.slug)}
                      className="text-h8 w-fit rounded hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {cinema.name}
                    </Link>
                    <p className="flex items-start gap-1.5 text-sm font-medium text-info">
                      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                      {cinema.address}, {cinema.city}
                    </p>
                  </div>
                  <ShowtimeChips showtimes={showtimes} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
