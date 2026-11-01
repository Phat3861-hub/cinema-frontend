"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Segmented } from "@/components/ui/tabs";
import { genreApi, movieApi } from "@/features/movie/api";
import { MovieCard, MovieCardSkeleton, MovieGrid } from "@/features/movie/components/movie-card";
import { genreLabel } from "@/features/movie/labels";
import { AGE_RATINGS, type AgeRating, type MovieStatus } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useT } from "@/i18n";

const PAGE_SIZE = 15;
const FILTER_KEYS = ["status", "genre", "ageRating", "keyword", "sort", "page"] as const;
const SORTS = ["releaseDate,desc", "releaseDate,asc", "title,asc", "avgRating,desc"] as const;

/** `/movies`: now showing / coming soon tabs, genre + age filters, accent-insensitive search, sort, paging. */
export function MoviesScreen() {
  const t = useT();
  const { values, set } = useUrlFilters(FILTER_KEYS);
  const status = (values.status || "NOW_SHOWING") as MovieStatus | "ALL";
  const page = Number(values.page) || 0;
  const [keyword, setKeyword] = useState(values.keyword);
  // The header search also navigates here: follow the URL when its keyword changes.
  const [urlKeyword, setUrlKeyword] = useState(values.keyword);
  if (urlKeyword !== values.keyword) {
    setUrlKeyword(values.keyword);
    setKeyword(values.keyword);
  }

  const genres = useApi("genres", genreApi.list);
  const query = {
    status: status === "ALL" ? undefined : status,
    genre: values.genre || undefined,
    ageRating: (values.ageRating || undefined) as AgeRating | undefined,
    keyword: values.keyword || undefined,
    sort: values.sort || SORTS[0],
    page,
    size: PAGE_SIZE,
  };
  const movies = useApi(`movies:${JSON.stringify(query)}`, () => movieApi.search(query));

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    set({ keyword: keyword.trim() });
  }

  return (
    <section className="mx-auto flex w-full max-w-[1232px] flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h6 sm:text-h4">{t.movie.listTitle}</h1>
        <p className="text-sm font-medium text-fg-muted">{t.movie.listSubtitle}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            label={t.movie.statusFilter}
            value={status}
            onChange={(value) => set({ status: value === "NOW_SHOWING" ? undefined : value })}
            items={[
              { value: "NOW_SHOWING", label: t.movie.status.NOW_SHOWING },
              { value: "COMING_SOON", label: t.movie.status.COMING_SOON },
              { value: "ALL", label: t.common.all },
            ]}
          />
          <form role="search" onSubmit={submitSearch} className="flex gap-2 lg:w-96">
            <div className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label={t.nav.searchLabel}
                placeholder={t.movie.searchPlaceholder}
                className="h-10 w-full rounded border border-line-strong bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" size="md">
              {t.common.search}
            </Button>
          </form>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select aria-label={t.movie.genre} value={values.genre} onChange={(e) => set({ genre: e.target.value })}>
            <option value="">{t.movie.allGenres}</option>
            {genres.data?.map((genre) => (
              <option key={genre.id} value={genre.slug}>
                {genreLabel(genre, t)}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t.movie.ageRating}
            value={values.ageRating}
            onChange={(e) => set({ ageRating: e.target.value })}
          >
            <option value="">{t.movie.allAges}</option>
            {AGE_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating} – {t.movie.ageHint[rating]}
              </option>
            ))}
          </Select>
          <Select aria-label={t.common.sortBy} value={values.sort || SORTS[0]} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {t.movie.sorts[sort]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {movies.error && !movies.data ? (
        <ErrorState error={movies.error} onRetry={movies.reload} />
      ) : movies.loading && !movies.data ? (
        <MovieGrid>
          {Array.from({ length: 10 }, (_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </MovieGrid>
      ) : movies.data && movies.data.content.length > 0 ? (
        <div className={`flex flex-col gap-10 transition-opacity ${movies.loading ? "opacity-60" : ""}`}>
          <p className="text-sm font-semibold text-fg-muted" aria-live="polite">
            {t.movie.found(movies.data.totalElements)}
          </p>
          <MovieGrid>
            {movies.data.content.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </MovieGrid>
          <Pagination page={page} totalPages={movies.data.totalPages} onChange={(p) => set({ page: p })} />
        </div>
      ) : (
        <EmptyState title={t.movie.emptyTitle} description={t.movie.emptyText} />
      )}
    </section>
  );
}
