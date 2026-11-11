"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { favoriteApi } from "@/features/movie/api";
import { MovieCard, MovieCardSkeleton } from "@/features/movie/components/movie-card";
import { useFavorites } from "@/features/movie/hooks/use-favorites";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";

const PAGE_SIZE = 12;
const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4";

/**
 * `/favorites`: the signed-in user's favourite movies, most recently added first. A movie un-hearted here leaves the
 * grid at once (the list is filtered by the shared favourite ids).
 */
export function MyFavorites() {
  const t = useT();
  const [page, setPage] = useState(0);
  const { ids, loaded } = useFavorites();
  const list = useApi(`favorites:${page}`, () => favoriteApi.list({ page, size: PAGE_SIZE }));
  const data = list.data;
  const movies = data?.content.filter((movie) => !loaded || ids.has(movie.id)) ?? [];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6" aria-labelledby="favorites-title">
      <div>
        <h1 id="favorites-title" className="text-h6">
          {t.movie.favoritesTitle}
        </h1>
        <p className="mt-1 text-sm font-medium text-fg-muted">{t.movie.favoritesHint}</p>
      </div>
      {list.error !== undefined && !data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !data ? (
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <>
          <EmptyState icon={Heart} title={t.movie.favoritesEmpty} description={t.movie.favoritesEmptyHint} />
          <Link href={ROUTES.movies} className={`${buttonClasses({ variant: "outline" })} self-center`}>
            {t.movie.browse}
          </Link>
        </>
      ) : (
        <div className={`${GRID} transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </section>
  );
}
