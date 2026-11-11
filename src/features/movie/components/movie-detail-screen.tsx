"use client";

import { CalendarDays, Clock, Globe, Languages, Play, Ticket, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { movieApi } from "@/features/movie/api";
import { FavoriteButton } from "@/features/movie/components/favorite-button";
import { AgeBadge, MovieStatusBadge, Rating } from "@/features/movie/components/movie-badges";
import { MovieReviews } from "@/features/movie/components/movie-reviews";
import { genreLabel, splitCast, youtubeEmbedUrl } from "@/features/movie/labels";
import type { Movie } from "@/features/movie/types";
import { MovieShowtimes } from "@/features/showtime/components/movie-showtimes";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";

/** Ticketor Movie Details: poster + trailer hero, synopsis, crew, cast chips, showtimes by cinema, then reviews. */
export function MovieDetailScreen({ slug }: { slug: string }) {
  const { data: movie, error, loading, reload, setData } = useApi(`movie:${slug}`, () => movieApi.bySlug(slug));

  if (error instanceof ApiError && error.code === "MOVIE_NOT_FOUND") notFound();
  if (error && !movie) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !movie) return <DetailSkeleton />;

  return (
    <div className="flex flex-col gap-12 pb-8">
      <Hero movie={movie} />
      <section id="showtimes" className="mx-auto w-full max-w-[1232px] scroll-mt-24 px-4">
        <MovieShowtimes movie={movie} />
      </section>
      <MovieReviews
        movie={movie}
        onRatingChange={(summary) =>
          setData((current) => current && { ...current, avgRating: summary.average, ratingCount: summary.count })
        }
      />
    </div>
  );
}

function Hero({ movie }: { movie: Movie }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(movie.trailerUrl);
  const cast = splitCast(movie.castMembers);

  const facts = [
    { icon: Clock, label: t.movie.duration, value: t.common.duration(movie.durationMinutes) },
    {
      icon: CalendarDays,
      label: t.movie.releaseDate,
      value: `${formatDate(movie.releaseDate, intlLocale)}${movie.endDate ? ` – ${formatDate(movie.endDate, intlLocale)}` : ""}`,
    },
    { icon: Languages, label: t.movie.language, value: movie.language },
    { icon: Globe, label: t.movie.country, value: movie.country },
  ].filter((fact) => fact.value);

  return (
    <section className="relative" aria-labelledby="movie-title">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-110 opacity-30 blur-2xl">
          <CoverImage src={movie.posterUrl} alt="" sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-page/40 via-page/85 to-page" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1232px] gap-8 px-4 pt-6 pb-4 md:grid-cols-[280px_1fr] lg:gap-12">
        <div className="relative mx-auto aspect-[2/3] w-56 overflow-hidden rounded-xl border border-line shadow-2xl md:w-full">
          <CoverImage src={movie.posterUrl} alt={movie.title} sizes="280px" priority />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <MovieStatusBadge status={movie.status} />
              <AgeBadge rating={movie.ageRating} withLabel />
              {movie.avgRating !== null && (
                <a href="#reviews" className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-accent">
                  <Rating value={movie.avgRating} count={movie.ratingCount} />
                </a>
              )}
            </div>
            <h1 id="movie-title" className="text-h4 sm:text-5xl sm:leading-tight sm:font-bold">
              {movie.title}
            </h1>
            <ul className="flex flex-wrap gap-2" aria-label={t.movie.genre}>
              {movie.genres.map((genre) => (
                <li key={genre.id} className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-fg-2">
                  {genreLabel(genre, t)}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1 rounded-lg border border-line bg-surface/70 p-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
                  <Icon aria-hidden className="size-3.5" />
                  {label}
                </dt>
                <dd className="text-sm font-bold text-fg">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-3">
            <FavoriteButton movieId={movie.id} title={movie.title} variant="button" className="order-last" />
            {movie.status !== "ENDED" && (
              <a href="#showtimes" className="inline-flex h-12 items-center gap-2 rounded bg-primary px-6 font-medium text-black hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <Ticket aria-hidden className="size-5" />
                {t.movie.buyTicket}
              </a>
            )}
            {movie.trailerUrl &&
              (embed ? (
                <Button variant="outline" onClick={() => setPlaying(true)}>
                  <Play aria-hidden className="size-5" />
                  {t.movie.watchTrailer}
                </Button>
              ) : (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded border border-line-strong px-6 font-medium text-fg hover:bg-surface-2"
                >
                  <Play aria-hidden className="size-5" />
                  {t.movie.watchTrailer}
                </a>
              ))}
          </div>

          {playing && embed && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
              <iframe
                src={embed}
                title={t.movie.trailerOf(movie.title)}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
              <button
                type="button"
                onClick={() => setPlaying(false)}
                aria-label={t.common.close}
                className="absolute top-2 right-2 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          )}

          {movie.description && (
            <div className="flex flex-col gap-2">
              <h2 className="text-h8">{t.movie.synopsis}</h2>
              <p className="text-sm leading-relaxed font-medium whitespace-pre-line text-fg-2">{movie.description}</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            {movie.director && (
              <div className="flex flex-col gap-2">
                <h2 className="text-h8">{t.movie.director}</h2>
                <p className="text-sm font-semibold text-fg-2">{movie.director}</p>
              </div>
            )}
            {cast.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-h8">{t.movie.cast}</h2>
                <ul className="flex flex-wrap gap-2">
                  {cast.map((name) => (
                    <li key={name} className="rounded bg-surface-2 px-3 py-1 text-xs font-semibold text-fg-2">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1232px] gap-8 px-4 py-8 md:grid-cols-[280px_1fr]">
      <Skeleton className="mx-auto aspect-[2/3] w-56 rounded-xl md:w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
