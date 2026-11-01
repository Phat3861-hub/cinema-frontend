"use client";

import { Film, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { genreApi, movieApi } from "@/features/movie/api";
import { AgeBadge, MovieStatusBadge } from "@/features/movie/components/movie-badges";
import { genreLabel } from "@/features/movie/labels";
import { AGE_RATINGS, type MovieStatus, type MovieSummary } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDate } from "@/lib/format";

const KEYS = ["status", "genre", "ageRating", "keyword", "page"] as const;

/** Movies table (BankDash Transaction): status tabs, search, genre / age filters, paging, delete dialog. */
export function AdminMoviesScreen() {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { values, set } = useUrlFilters(KEYS);
  const [typed, setTyped] = useState(values.keyword);
  const [toDelete, setToDelete] = useState<MovieSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const page = Number(values.page) || 0;

  const genres = useApi("genres", genreApi.list);
  const query = {
    status: (values.status || undefined) as MovieStatus | undefined,
    genre: values.genre || undefined,
    ageRating: (values.ageRating || undefined) as MovieSummary["ageRating"] | undefined,
    keyword: values.keyword || undefined,
    page,
    size: 10,
    sort: "createdAt,desc",
  };
  const movies = useApi(`admin-movies:${JSON.stringify(query)}`, () => movieApi.search(query));

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await movieApi.remove(toDelete.id);
      toast.success(t.admin.movies.deleted(toDelete.title));
      setToDelete(null);
      movies.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.movies.subtitle}</p>
        <Link href={ROUTES.admin.movieNew} className={buttonClasses({ size: "md" })}>
          <Plus aria-hidden className="size-4" />
          {t.admin.movies.add}
        </Link>
      </div>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <Tabs
          label={t.movie.statusFilter}
          value={values.status as MovieStatus | ""}
          onChange={(status) => set({ status })}
          items={[
            { value: "", label: t.common.all },
            { value: "NOW_SHOWING", label: t.movie.status.NOW_SHOWING },
            { value: "COMING_SOON", label: t.movie.status.COMING_SOON },
            { value: "ENDED", label: t.movie.status.ENDED },
          ]}
        />
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <form
            role="search"
            className="relative"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              set({ keyword: typed.trim() });
            }}
          >
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label={t.nav.searchLabel}
              placeholder={t.admin.movies.searchPlaceholder}
              className="h-10 w-full rounded border border-line-strong bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </form>
          <Select aria-label={t.movie.genre} value={values.genre} onChange={(e) => set({ genre: e.target.value })}>
            <option value="">{t.movie.allGenres}</option>
            {genres.data?.map((g) => (
              <option key={g.id} value={g.slug}>
                {genreLabel(g, t)}
              </option>
            ))}
          </Select>
          <Select aria-label={t.movie.ageRating} value={values.ageRating} onChange={(e) => set({ ageRating: e.target.value })}>
            <option value="">{t.movie.allAges}</option>
            {AGE_RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {movies.error && !movies.data ? (
          <ErrorState error={movies.error} onRetry={movies.reload} />
        ) : movies.data && movies.data.content.length === 0 ? (
          <EmptyState
            icon={Film}
            title={t.admin.movies.empty}
            action={
              <Link href={ROUTES.admin.movieNew} className={buttonClasses({ size: "md" })}>
                {t.admin.movies.add}
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t.admin.movies.colMovie}</Th>
                  <Th>{t.movie.genre}</Th>
                  <Th>{t.movie.duration}</Th>
                  <Th>{t.admin.movies.colDates}</Th>
                  <Th>{t.movie.ageRating}</Th>
                  <Th>{t.admin.common.status}</Th>
                  <Th className="text-right">{t.admin.common.actions}</Th>
                </tr>
              </thead>
              {movies.loading && !movies.data ? (
                <TableSkeleton columns={7} />
              ) : (
                <tbody className={movies.loading ? "opacity-60" : ""}>
                  {movies.data?.content.map((movie) => (
                    <tr key={movie.id} className="hover:bg-surface-2/60">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-surface-3">
                            <CoverImage src={movie.posterUrl} alt="" sizes="40px" />
                          </div>
                          <Link href={ROUTES.admin.movieEdit(movie.id)} className="max-w-56 font-bold text-fg hover:underline">
                            {movie.title}
                          </Link>
                        </div>
                      </Td>
                      <Td className="max-w-44 truncate">{movie.genres.map((g) => genreLabel(g, t)).join(", ")}</Td>
                      <Td className="whitespace-nowrap">{t.common.minutes(movie.durationMinutes)}</Td>
                      <Td className="whitespace-nowrap">
                        {formatDate(movie.releaseDate, intlLocale)}
                        {movie.endDate && <span className="text-fg-subtle"> – {formatDate(movie.endDate, intlLocale)}</span>}
                      </Td>
                      <Td>
                        <AgeBadge rating={movie.ageRating} />
                      </Td>
                      <Td>
                        <MovieStatusBadge status={movie.status} />
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={ROUTES.admin.movieEdit(movie.id)}
                            aria-label={t.common.editItem(movie.title)}
                            title={t.common.edit}
                            className="inline-flex size-9 items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <Pencil aria-hidden className="size-4" />
                          </Link>
                          <IconButton label={t.common.deleteItem(movie.title)} tone="danger" onClick={() => setToDelete(movie)}>
                            <Trash2 aria-hidden className="size-4" />
                          </IconButton>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              )}
            </Table>
            {movies.data && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-fg-muted">{t.admin.common.total(movies.data.totalElements)}</p>
                <Pagination page={page} totalPages={movies.data.totalPages} onChange={(p) => set({ page: p })} />
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t.admin.movies.deleteTitle}
        description={toDelete ? t.admin.movies.deleteText(toDelete.title) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}
