"use client";

import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { AgeBadge, Rating } from "@/features/movie/components/movie-badges";
import { genreLabel } from "@/features/movie/labels";
import type { MovieSummary } from "@/features/movie/types";
import { useLocale, useT } from "@/i18n";
import { formatDate } from "@/lib/format";

/** Ticketor home card: 2:3 poster, title, genres, duration, age badge, stars (if any). */
export function MovieCard({ movie, priority = false }: { movie: MovieSummary; priority?: boolean }) {
  const t = useT();
  const { intlLocale } = useLocale();

  return (
    <Link
      href={ROUTES.movieDetail(movie.slug)}
      className="group flex flex-col gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-3">
        <CoverImage
          src={movie.posterUrl}
          alt={movie.title}
          priority={priority}
          sizes="(min-width: 1280px) 240px, (min-width: 768px) 25vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
        <div className="absolute top-2 left-2">
          <AgeBadge rating={movie.ageRating} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-h8 line-clamp-2 transition-colors group-hover:text-accent">{movie.title}</h3>
        <p className="line-clamp-1 text-xs font-semibold text-fg-muted">
          {movie.genres.map((g) => genreLabel(g, t)).join(" · ") || "—"}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-fg-2">
          {movie.status === "COMING_SOON" ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden className="size-3.5" />
              {formatDate(movie.releaseDate, intlLocale)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" />
              {t.common.duration(movie.durationMinutes)}
            </span>
          )}
          <Rating value={movie.avgRating} />
        </div>
      </div>
    </Link>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function MovieGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>;
}
