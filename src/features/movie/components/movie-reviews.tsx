"use client";

import { LogIn, MessageSquareText, Pencil, Star, Ticket, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { ROUTES, withQuery } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { reviewApi } from "@/features/movie/api";
import { REVIEW_COMMENT_MAX, type Movie, type MyReview, type Review, type ReviewSummary } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;
const STAR_VALUES = [1, 2, 3, 4, 5];

/** "4,3" (vi) / "4.3" (en). */
export function formatAverage(value: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** Read-only stars; a fractional value fills the last star partly. */
export function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span aria-hidden className="relative inline-flex shrink-0">
      <span className="flex text-line-strong">
        {STAR_VALUES.map((n) => (
          <Star key={n} className={className} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden"
        style={{ width: `${(Math.min(Math.max(value, 0), 5) / 5) * 100}%` }}
      >
        {STAR_VALUES.map((n) => (
          <Star key={n} className={`${className} shrink-0 fill-primary text-primary`} />
        ))}
      </span>
    </span>
  );
}

/**
 * Movie detail `#reviews` (MOV-05 / MOV-06): rating summary with a per-star filter, the signed-in customer's own
 * review (write / edit / delete, or why they cannot) and the public list with "show more".
 */
export function MovieReviews({ movie, onRatingChange }: { movie: Movie; onRatingChange: (summary: ReviewSummary) => void }) {
  const t = useT();
  const [stars, setStars] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const summary = useApi(`reviews:summary:${movie.id}`, () => reviewApi.summary(movie.id));
  const scrolledToHash = useRef(false);

  // The block renders after the movie loads, so the browser's own jump to `#reviews` (from "My tickets") misses it.
  useEffect(() => {
    if (scrolledToHash.current || !summary.data || window.location.hash !== "#reviews") return;
    scrolledToHash.current = true;
    requestAnimationFrame(() => document.getElementById("reviews")?.scrollIntoView());
  }, [summary.data]);

  /** After the customer's own write: new summary (also for the hero's rating), list and own review. */
  async function refresh() {
    setVersion((v) => v + 1);
    try {
      const next = await reviewApi.summary(movie.id);
      summary.setData(() => next);
      onRatingChange(next);
    } catch {
      summary.reload();
    }
  }

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mx-auto w-full max-w-[1232px] scroll-mt-24 px-4">
      <h2 id="reviews-title" className="text-h6 mb-6">
        {t.reviews.title}
      </h2>
      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-6">
          {summary.error && !summary.data ? (
            <ErrorState error={summary.error} onRetry={summary.reload} />
          ) : summary.data ? (
            <SummaryCard summary={summary.data} stars={stars} onStars={setStars} />
          ) : (
            <Skeleton className="h-64 rounded-2xl" />
          )}
          <MyReviewCard movie={movie} version={version} onChanged={refresh} />
        </div>
        <ReviewList movieId={movie.id} stars={stars} version={version} onClearStars={() => setStars(null)} />
      </div>
    </section>
  );
}

function SummaryCard({
  summary,
  stars,
  onStars,
}: {
  summary: ReviewSummary;
  stars: number | null;
  onStars: (stars: number | null) => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const max = Math.max(1, ...summary.distribution.map((row) => row.count));

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      {summary.average === null ? (
        <p className="text-h8">{t.reviews.noReviews}</p>
      ) : (
        <div className="flex items-center gap-4">
          <p className="flex items-baseline gap-1">
            <span className="sr-only">{t.reviews.average(formatAverage(summary.average, intlLocale))}</span>
            <span aria-hidden className="text-5xl leading-none font-extrabold text-fg">
              {formatAverage(summary.average, intlLocale)}
            </span>
            <span aria-hidden className="text-base font-semibold text-fg-muted">
              /5
            </span>
          </p>
          <div className="flex flex-col gap-1">
            <Stars value={summary.average} className="size-5" />
            <p className="text-sm font-semibold text-fg-muted">{t.reviews.count(summary.count)}</p>
          </div>
        </div>
      )}
      <div role="group" aria-label={t.reviews.distribution} className="flex flex-col gap-1">
        {summary.distribution.map((row) => {
          const active = stars === row.stars;
          return (
            <button
              key={row.stars}
              type="button"
              aria-pressed={active}
              aria-label={t.reviews.filterByStars(row.stars, row.count)}
              disabled={row.count === 0 && !active}
              onClick={() => onStars(active ? null : row.stars)}
              className={
                "flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs font-semibold text-fg-2 transition-colors " +
                "hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50 " +
                "disabled:hover:bg-transparent " +
                (active ? "bg-surface-2 ring-1 ring-primary" : "")
              }
            >
              <span className="w-3 text-right tabular-nums">{row.stars}</span>
              <Star aria-hidden className="size-3 fill-primary text-primary" />
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right text-fg-muted tabular-nums">{row.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MyReviewCard({ movie, version, onChanged }: { movie: Movie; version: number; onChanged: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const { status, user } = useSession();
  const canWrite = hasAny(user, ["REVIEW_CREATE"]);
  const mine = useApi(status === "authenticated" && canWrite ? `reviews:me:${movie.id}:${version}` : null, () =>
    reviewApi.mine(movie.id),
  );
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (status === "loading") return <Skeleton className="h-40 rounded-2xl" />;
  if (status === "anonymous") {
    return (
      <Box>
        <p className="text-sm font-medium text-fg-2">{t.reviews.loginPrompt}</p>
        <Link
          href={withQuery(ROUTES.login, { next: `${ROUTES.movieDetail(movie.slug)}#reviews` })}
          className={`${buttonClasses({ variant: "outline", size: "md" })} self-start`}
        >
          <LogIn aria-hidden className="size-4" />
          {t.reviews.login}
        </Link>
      </Box>
    );
  }
  // Staff accounts without REVIEW_CREATE only read reviews.
  if (!canWrite) return null;
  if (mine.error && !mine.data) return <ErrorState error={mine.error} onRetry={mine.reload} />;
  if (!mine.data) return <Skeleton className="h-40 rounded-2xl" />;

  const { canReview, review } = mine.data;

  async function remove(target: MyReview) {
    setDeleting(true);
    try {
      await reviewApi.remove(target.id);
      toast.success(t.reviews.deleted);
      setConfirmDelete(false);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  }

  if (review && editing) {
    return (
      <Box title={t.reviews.editTitle}>
        <ReviewForm
          movieId={movie.id}
          review={review}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      </Box>
    );
  }

  if (review) {
    const hidden = review.status === "HIDDEN";
    return (
      <Box title={t.reviews.yourReview}>
        {hidden && review.hiddenReason && (
          <Alert tone="warning">
            <p className="font-semibold">{t.reviews.hiddenTitle(t.reviews.hiddenReason[review.hiddenReason])}</p>
            <p className="mt-1 text-fg-2">{t.reviews.hiddenText}</p>
            {review.hiddenNote && <p className="mt-1 text-fg-2">{t.reviews.moderatorNote(review.hiddenNote)}</p>}
          </Alert>
        )}
        <div className={`flex flex-col gap-2 ${hidden ? "opacity-70" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={review.rating} />
            <span className="text-sm font-semibold text-fg">{t.reviews.scale[review.rating - 1]}</span>
            <span className="sr-only">{t.reviews.stars(review.rating)}</span>
          </div>
          {review.comment && <p className="text-sm font-medium break-words whitespace-pre-line text-fg-2">{review.comment}</p>}
          <p className="text-xs font-medium text-fg-muted">{formatDate(review.createdAt, intlLocale)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hidden && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil aria-hidden className="size-4" />
              {t.common.edit}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden className="size-4" />
            {t.common.delete}
          </Button>
        </div>
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => remove(review)}
          loading={deleting}
          title={t.reviews.deleteTitle}
          description={t.reviews.deleteText}
          confirmLabel={t.common.delete}
        />
      </Box>
    );
  }

  if (canReview) {
    return (
      <Box title={t.reviews.writeTitle}>
        <ReviewForm movieId={movie.id} onSaved={onChanged} />
      </Box>
    );
  }

  return (
    <Box>
      <p className="flex gap-2 text-sm font-medium text-fg-2">
        <Ticket aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
        {t.reviews.notWatched}
      </p>
    </Box>
  );
}

function Box({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      {title && <h3 className="text-h8">{title}</h3>}
      {children}
    </div>
  );
}

function ReviewForm({
  movieId,
  review,
  onSaved,
  onCancel,
}: {
  movieId: number;
  review?: MyReview;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [ratingError, setRatingError] = useState<string>();
  const [commentError, setCommentError] = useState<string>();
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = comment.trim();
    const ratingMissing = rating < 1 ? t.reviews.pickRating : undefined;
    const tooLong = trimmed.length > REVIEW_COMMENT_MAX ? t.admin.validation.tooLong(REVIEW_COMMENT_MAX) : undefined;
    setRatingError(ratingMissing);
    setCommentError(tooLong);
    if (ratingMissing || tooLong) return;
    setSaving(true);
    setFormError(null);
    const body = { rating, comment: trimmed || undefined };
    try {
      if (review) await reviewApi.update(review.id, body);
      else await reviewApi.create(movieId, body);
      toast.success(review ? t.reviews.updated : t.reviews.created);
      onSaved();
    } catch (error) {
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
      <StarPicker
        value={rating}
        error={ratingError}
        onChange={(value) => {
          setRating(value);
          setRatingError(undefined);
        }}
      />
      <TextareaField
        label={t.reviews.comment}
        optional
        rows={4}
        value={comment}
        maxLength={REVIEW_COMMENT_MAX}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t.reviews.commentPlaceholder}
        hint={`${comment.length}/${REVIEW_COMMENT_MAX}`}
        error={commentError}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="md" loading={saving}>
          {review ? t.common.save : t.reviews.submit}
        </Button>
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel} disabled={saving}>
            <X aria-hidden className="size-4" />
            {t.common.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Native radio buttons (arrow keys move between stars) drawn as stars; hovering previews a value. */
function StarPicker({ value, error, onChange }: { value: number; error?: string; onChange: (value: number) => void }) {
  const t = useT();
  const name = useId();
  const errorId = `${name}-error`;
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-fg-2">
        {t.reviews.yourRating} <span className="text-danger">*</span>
      </legend>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {STAR_VALUES.map((n) => (
            <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                aria-label={`${t.reviews.stars(n)} – ${t.reviews.scale[n - 1]}`}
                className="peer sr-only"
              />
              <Star
                aria-hidden
                className={
                  "size-8 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 " +
                  "peer-focus-visible:outline-accent " +
                  (n <= shown ? "fill-primary text-primary" : "text-line-strong")
                }
              />
            </label>
          ))}
        </div>
        <span aria-hidden className="min-w-20 text-sm font-semibold text-fg">
          {shown ? t.reviews.scale[shown - 1] : ""}
        </span>
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function ReviewList({
  movieId,
  stars,
  version,
  onClearStars,
}: {
  movieId: number;
  stars: number | null;
  version: number;
  onClearStars: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const listKey = `${movieId}:${stars ?? "all"}:${version}`;
  const first = useApi(`reviews:list:${listKey}`, () => reviewApi.list(movieId, { rating: stars ?? undefined, size: PAGE_SIZE }));
  const [more, setMore] = useState<{ key: string; page: number; items: Review[] }>({ key: "", page: 0, items: [] });
  const [loadingMore, setLoadingMore] = useState(false);

  // Pages loaded with "show more" belong to one filter; a new filter (or a write) starts again from page 0.
  const extra = more.key === listKey ? more : { key: listKey, page: 0, items: [] };
  const seen = new Set<number>();
  const items = [...(first.data?.content ?? []), ...extra.items].filter((review) => !seen.has(review.id) && seen.add(review.id));
  const hasMore = !!first.data && extra.page + 1 < first.data.totalPages;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await reviewApi.list(movieId, { rating: stars ?? undefined, page: extra.page + 1, size: PAGE_SIZE });
      setMore({ key: listKey, page: extra.page + 1, items: [...extra.items, ...page.content] });
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h3 className="text-h8">{t.reviews.list}</h3>
        <div aria-live="polite">
          {stars !== null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-line-strong py-1 pr-1 pl-3 text-xs font-semibold text-fg-2">
              {t.reviews.showingStars(stars)}
              <button
                type="button"
                onClick={onClearStars}
                aria-label={t.reviews.clearFilter}
                title={t.reviews.clearFilter}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      {first.error && !first.data ? (
        <ErrorState error={first.error} onRetry={first.reload} />
      ) : !first.data ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={MessageSquareText}
            title={stars !== null ? t.reviews.emptyFiltered(stars) : t.reviews.noReviews}
            description={stars !== null ? undefined : t.reviews.noReviewsHint}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}

      {hasMore && (
        <Button variant="outline" size="md" className="self-center" onClick={loadMore} loading={loadingMore}>
          {t.reviews.loadMore}
        </Button>
      )}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const initial = review.authorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <li className="flex gap-3 rounded-xl border border-line bg-surface p-4">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-bold text-fg-2"
      >
        {initial}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="font-semibold text-fg">{review.authorName}</p>
          <p className="text-xs font-medium text-fg-muted">{formatDate(review.createdAt, intlLocale)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Stars value={review.rating} className="size-3.5" />
          <span className="sr-only">{t.reviews.stars(review.rating)}</span>
        </div>
        {review.comment && <p className="text-sm font-medium break-words whitespace-pre-line text-fg-2">{review.comment}</p>}
      </div>
    </li>
  );
}
