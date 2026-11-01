"use client";

import { ArrowRight, Clock, Gift, Play, Popcorn, Ticket } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES, withQuery } from "@/constants/routes";
import { movieApi } from "@/features/movie/api";
import { AgeBadge, Rating } from "@/features/movie/components/movie-badges";
import { MovieCard, MovieCardSkeleton, MovieGrid } from "@/features/movie/components/movie-card";
import { genreLabel } from "@/features/movie/labels";
import type { MovieStatus, MovieSummary } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import type { PageResponse } from "@/types/api";

const SECTION = "mx-auto w-full max-w-[1232px] px-4";

/** Ticketor Home: hero, now showing, coming soon, offers, FAQ (stats / partners / app blocks dropped). */
export function HomeScreen() {
  const nowShowing = useApi("home:now", () => movieApi.search({ status: "NOW_SHOWING", size: 10, sort: "releaseDate,desc" }));

  return (
    <div className="flex flex-col gap-16 pb-8">
      <Hero movie={nowShowing.data?.content[0]} loading={nowShowing.loading && !nowShowing.data} />
      <MovieSection status="NOW_SHOWING" result={nowShowing} />
      <ComingSoonSection />
      <Offers />
      <Faq />
    </div>
  );
}

function Hero({ movie, loading }: { movie?: MovieSummary; loading: boolean }) {
  const t = useT();
  if (loading) {
    return (
      <div className={SECTION}>
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section className={SECTION} aria-labelledby="hero-title">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        {movie && (
          <div aria-hidden className="absolute inset-0 opacity-50 blur-sm">
            <CoverImage src={movie.posterUrl} alt="" sizes="100vw" priority />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-black/30" />
        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 md:grid-cols-[1fr_auto] md:py-14">
          <div className="flex max-w-xl flex-col gap-5 text-white">
            <span className="inline-flex w-fit items-center gap-2 rounded bg-primary px-3 py-1 text-xs font-bold text-black uppercase">
              <Ticket aria-hidden className="size-4" />
              {movie ? t.home.featured : t.home.welcomeTag}
            </span>
            <h1 id="hero-title" className="text-h4 sm:text-5xl sm:leading-tight sm:font-bold">
              {movie ? movie.title : t.home.welcomeTitle}
            </h1>
            {movie ? (
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-neutral-200">
                <AgeBadge rating={movie.ageRating} withLabel />
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="size-4" />
                  {t.common.duration(movie.durationMinutes)}
                </span>
                <span>{movie.genres.map((g) => genreLabel(g, t)).join(" · ")}</span>
                <Rating value={movie.avgRating} />
              </div>
            ) : (
              <p className="text-neutral-200">{t.home.welcomeText}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {movie ? (
                <>
                  <Link href={`${ROUTES.movieDetail(movie.slug)}#showtimes`} className={buttonClasses()}>
                    <Ticket aria-hidden className="size-5" />
                    {t.movie.buyTicket}
                  </Link>
                  <Link
                    href={ROUTES.movieDetail(movie.slug)}
                    className={`${buttonClasses({ variant: "outline" })} border-white/40 text-white hover:bg-white/10`}
                  >
                    <Play aria-hidden className="size-5" />
                    {t.movie.details}
                  </Link>
                </>
              ) : (
                <Link href={ROUTES.movies} className={buttonClasses()}>
                  {t.home.browseMovies}
                </Link>
              )}
            </div>
          </div>
          {movie && (
            <div className="relative hidden aspect-[2/3] w-56 overflow-hidden rounded-xl border border-white/20 shadow-2xl md:block lg:w-64">
              <CoverImage src={movie.posterUrl} alt={movie.title} sizes="256px" priority />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MovieSection({
  status,
  result,
}: {
  status: MovieStatus;
  result: { data?: PageResponse<MovieSummary>; loading: boolean; error: unknown; reload: () => void };
}) {
  const t = useT();
  const { data, loading, error, reload } = result;
  const titleId = `section-${status}`;

  return (
    <section className={SECTION} aria-labelledby={titleId}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id={titleId} className="text-h6">
          {status === "NOW_SHOWING" ? t.home.nowShowing : t.home.comingSoon}
        </h2>
        <Link
          href={withQuery(ROUTES.movies, { status })}
          className="inline-flex items-center gap-1 rounded text-sm font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t.common.seeAll}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <MovieGrid>
          {Array.from({ length: 5 }, (_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </MovieGrid>
      ) : data && data.content.length > 0 ? (
        <MovieGrid>
          {data.content.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} priority={index < 5} />
          ))}
        </MovieGrid>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm font-medium text-fg-muted">
          {t.home.noMovies}
        </p>
      )}
    </section>
  );
}

function ComingSoonSection() {
  const result = useApi("home:soon", () => movieApi.search({ status: "COMING_SOON", size: 5, sort: "releaseDate,asc" }));
  return <MovieSection status="COMING_SOON" result={result} />;
}

function Offers() {
  const t = useT();
  const offers = [
    { icon: Gift, title: t.home.offer1Title, text: t.home.offer1Text },
    { icon: Popcorn, title: t.home.offer2Title, text: t.home.offer2Text },
  ];
  return (
    <section className={SECTION} aria-labelledby="offers-title">
      <h2 id="offers-title" className="text-h6 mb-6">
        {t.home.offers}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="flex gap-5 rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent/50"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-black">
              <Icon aria-hidden className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-h8">{title}</h3>
              <p className="text-sm font-medium text-fg-muted">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const t = useT();
  return (
    <section id="faq" className={`${SECTION} scroll-mt-24`} aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-h6 mb-6">
        {t.home.faq}
      </h2>
      <div className="flex flex-col gap-3">
        {t.home.faqItems.map((item) => (
          <details key={item.q} className="group rounded-lg border border-line bg-surface px-5 py-4 open:border-accent/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-fg">
              {item.q}
              <span aria-hidden className="text-xl text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm font-medium text-fg-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
