"use client";

import { CalendarX, MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { cinemaApi } from "@/features/cinema/api";
import type { Cinema } from "@/features/cinema/types";
import { AgeBadge } from "@/features/movie/components/movie-badges";
import { showtimeApi } from "@/features/showtime/api";
import { DateStrip } from "@/features/showtime/components/date-strip";
import { ShowtimeChips } from "@/features/showtime/components/showtime-chips";
import type { Showtime } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";

/** `/cinemas/[slug]`: cinema info + its schedule per day, grouped by movie. */
export function CinemaDetailScreen({ slug }: { slug: string }) {
  const { data: cinema, error, loading, reload } = useApi(`cinema:${slug}`, () => cinemaApi.bySlug(slug));

  if (error instanceof ApiError && error.code === "CINEMA_NOT_FOUND") notFound();
  if (error && !cinema) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !cinema) {
    return (
      <div className="mx-auto w-full max-w-[1232px] px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1232px] flex-col gap-10 px-4 py-6">
      <Info cinema={cinema} />
      <Schedule cinema={cinema} />
    </div>
  );
}

function Info({ cinema }: { cinema: Cinema }) {
  const t = useT();
  const mapUrl =
    cinema.latitude !== null && cinema.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${cinema.latitude},${cinema.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cinema.address}, ${cinema.city}`)}`;

  return (
    <section className="grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[2fr_3fr]">
      <div className="relative aspect-[16/10] bg-surface-3 md:aspect-auto">
        <CoverImage src={cinema.imageUrl} alt={cinema.name} sizes="(min-width: 768px) 480px, 100vw" priority />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <h1 className="text-h6 sm:text-h4">{cinema.name}</h1>
        <p className="flex items-start gap-2 font-medium text-info">
          <MapPin aria-hidden className="mt-1 size-5 shrink-0" />
          {[cinema.address, cinema.district, cinema.city].filter(Boolean).join(", ")}
        </p>
        {cinema.phone && (
          <p className="flex items-center gap-2 font-medium text-fg-2">
            <Phone aria-hidden className="size-5" />
            <a href={`tel:${cinema.phone}`} className="hover:underline">
              {cinema.phone}
            </a>
          </p>
        )}
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded border border-line-strong px-4 py-2 text-sm font-semibold text-fg hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Navigation aria-hidden className="size-4" />
          {t.cinema.directions}
        </a>
      </div>
    </section>
  );
}

function Schedule({ cinema }: { cinema: Cinema }) {
  const t = useT();
  const [picked, setPicked] = useState<string | null>(null);
  const dates = useApi(`dates:cinema:${cinema.id}`, () => showtimeApi.dates({ cinemaId: cinema.id }));
  const available = dates.data?.slice(0, 14) ?? [];
  const date = picked ?? available[0] ?? null;
  const showtimes = useApi(date ? `cinema-showtimes:${cinema.id}:${date}` : null, () =>
    showtimeApi.list({ cinemaId: cinema.id, date: date ?? undefined }),
  );

  const byMovie = new Map<number, Showtime[]>();
  for (const showtime of showtimes.data ?? []) {
    byMovie.set(showtime.movie.id, [...(byMovie.get(showtime.movie.id) ?? []), showtime]);
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="schedule-title">
      <h2 id="schedule-title" className="text-h6">
        {t.cinema.schedule}
      </h2>
      {dates.error && !dates.data ? (
        <ErrorState error={dates.error} onRetry={dates.reload} />
      ) : dates.loading && !dates.data ? (
        <Skeleton className="h-20 w-full" />
      ) : available.length === 0 ? (
        <EmptyState icon={CalendarX} title={t.showtime.noDates} description={t.showtime.noDatesHint} />
      ) : (
        <>
          <DateStrip dates={available} value={date ?? ""} onChange={setPicked} />
          {showtimes.loading && !showtimes.data ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : byMovie.size === 0 ? (
            <EmptyState icon={CalendarX} title={t.showtime.noneForFilter} />
          ) : (
            <ul className="flex flex-col gap-4">
              {[...byMovie.values()].map((items) => {
                const movie = items[0].movie;
                return (
                  <li key={movie.id} className="flex gap-4 rounded-2xl border border-line bg-surface p-4 sm:gap-6 sm:p-5">
                    <Link
                      href={ROUTES.movieDetail(movie.slug)}
                      className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-3 sm:w-28"
                    >
                      <CoverImage src={movie.posterUrl} alt={movie.title} sizes="112px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={ROUTES.movieDetail(movie.slug)}
                          className="text-h8 rounded hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {movie.title}
                        </Link>
                        <AgeBadge rating={movie.ageRating} />
                        <span className="text-xs font-semibold text-fg-muted">
                          {t.common.duration(movie.durationMinutes)}
                        </span>
                      </div>
                      <ShowtimeChips showtimes={items} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
