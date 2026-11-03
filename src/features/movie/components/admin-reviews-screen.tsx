"use client";

import { Eye, EyeOff, MessageSquareText, Search } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { movieApi, reviewApi } from "@/features/movie/api";
import { Stars } from "@/features/movie/components/movie-reviews";
import {
  REVIEW_HIDDEN_REASONS,
  REVIEW_STATUSES,
  type AdminReview,
  type ReviewFilter,
  type ReviewHiddenReason,
  type ReviewStatus,
} from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;
const NOTE_MAX = 255;

/**
 * Review moderation (MOV-06, REVIEW_MODERATE): post-moderation – reviews are public at once; a moderator hides
 * abusive ones with a reason the author sees, or shows them again. Hiding / showing recomputes the movie's rating.
 */
export function AdminReviewsScreen() {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const [status, setStatus] = useState<ReviewStatus | "ALL">("ALL");
  const [rating, setRating] = useState("");
  const [movieId, setMovieId] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [toHide, setToHide] = useState<AdminReview | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filter: ReviewFilter = {
    status: status === "ALL" ? undefined : status,
    rating: rating ? Number(rating) : undefined,
    movieId: movieId ? Number(movieId) : undefined,
    keyword: keyword || undefined,
    page,
    size: PAGE_SIZE,
  };
  const reviews = useApi(`reviews:moderate:${JSON.stringify(filter)}`, () => reviewApi.moderate(filter));
  const movies = useApi("reviews:movies", () => movieApi.search({ size: 100, sort: "releaseDate,desc" }));
  const list = reviews.data?.content ?? [];

  function search(event: FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(0);
  }

  async function show(review: AdminReview) {
    setBusyId(review.id);
    try {
      await reviewApi.changeStatus(review.id, { status: "VISIBLE" });
      toast.success(t.admin.reviews.shown);
      reviews.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-fg-muted">{t.admin.reviews.subtitle}</p>

      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="overflow-x-auto">
            <Segmented
              label={t.admin.common.status}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(0);
              }}
              items={[
                { value: "ALL", label: t.admin.reviews.allStatuses },
                ...REVIEW_STATUSES.map((value) => ({ value, label: t.admin.reviews.status[value] })),
              ]}
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-48 flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.reviews.movie}
              <select
                value={movieId}
                onChange={(event) => {
                  setMovieId(event.target.value);
                  setPage(0);
                }}
                className={controlClasses({ size: "md" })}
              >
                <option value="">{t.admin.reviews.allMovies}</option>
                {(movies.data?.content ?? []).map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-36 flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.reviews.rating}
              <select
                value={rating}
                onChange={(event) => {
                  setRating(event.target.value);
                  setPage(0);
                }}
                className={controlClasses({ size: "md" })}
              >
                <option value="">{t.admin.reviews.allStars}</option>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <option key={stars} value={stars}>
                    {t.reviews.stars(stars)}
                  </option>
                ))}
              </select>
            </label>
            <form onSubmit={search} role="search" aria-label={t.admin.reviews.keyword} className="flex items-end gap-2">
              <label className="flex min-w-48 flex-col gap-1 text-xs font-semibold text-fg-muted">
                {t.admin.reviews.keyword}
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder={t.admin.reviews.keywordPlaceholder}
                  maxLength={100}
                  className={controlClasses({ size: "md" })}
                />
              </label>
              <Button type="submit" size="md" variant="outline" className="shrink-0">
                <Search aria-hidden className="size-4" />
                {t.common.search}
              </Button>
            </form>
          </div>
        </div>

        {reviews.error && !reviews.data ? (
          <ErrorState error={reviews.error} onRetry={reviews.reload} />
        ) : reviews.data && list.length === 0 ? (
          <EmptyState icon={MessageSquareText} title={t.admin.reviews.empty} />
        ) : (
          <Table className="min-w-[1040px]">
            <thead>
              <tr>
                <Th>{t.admin.reviews.movie}</Th>
                <Th>{t.admin.reviews.customer}</Th>
                <Th>{t.admin.reviews.rating}</Th>
                <Th className="w-[32%]">{t.admin.reviews.comment}</Th>
                <Th>{t.admin.reviews.date}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!reviews.data ? (
              <TableSkeleton columns={7} />
            ) : (
              <tbody>
                {list.map((review) => {
                  const hidden = review.status === "HIDDEN";
                  return (
                    <tr key={review.id} className={hidden ? "bg-surface-2/50" : undefined}>
                      <Td>
                        <Link
                          href={`${ROUTES.movieDetail(review.movie.slug)}#reviews`}
                          className="line-clamp-2 max-w-44 font-semibold text-fg hover:text-accent"
                        >
                          {review.movie.title}
                        </Link>
                      </Td>
                      <Td>
                        <p className="max-w-48 truncate font-medium text-fg">{review.user.fullName}</p>
                        <p className="max-w-48 truncate text-xs text-fg-muted">{review.user.email}</p>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Stars value={review.rating} className="size-3.5" />
                          <span className="text-xs font-bold text-fg-2 tabular-nums">{review.rating}/5</span>
                        </span>
                      </Td>
                      <Td>
                        {review.comment ? (
                          <p className="line-clamp-3 text-sm break-words whitespace-pre-line text-fg-2" title={review.comment}>
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-sm text-fg-subtle italic">{t.admin.reviews.noComment}</p>
                        )}
                      </Td>
                      <Td className="text-xs whitespace-nowrap text-fg-2">
                        <p>{formatDateTime(review.createdAt, intlLocale)}</p>
                      </Td>
                      <Td>
                        <div className="flex max-w-56 flex-col items-start gap-1">
                          <Badge tone={hidden ? "danger" : "success"}>{t.admin.reviews.status[review.status]}</Badge>
                          {hidden && review.hiddenReason && (
                            <>
                              <p className="text-xs font-semibold text-fg-2">{t.reviews.hiddenReason[review.hiddenReason]}</p>
                              {review.hiddenNote && (
                                <p className="line-clamp-2 text-xs text-fg-muted" title={review.hiddenNote}>
                                  {review.hiddenNote}
                                </p>
                              )}
                              {review.hiddenAt && (
                                <p className="text-xs text-fg-muted">
                                  {t.admin.reviews.hiddenBy(
                                    review.hiddenByName ?? "—",
                                    formatDateTime(review.hiddenAt, intlLocale),
                                  )}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          {hidden ? (
                            <IconButton
                              label={t.admin.reviews.show(review.user.fullName)}
                              onClick={() => show(review)}
                              disabled={busyId === review.id}
                            >
                              <Eye aria-hidden className="size-4" />
                            </IconButton>
                          ) : (
                            <IconButton label={t.admin.reviews.hide(review.user.fullName)} onClick={() => setToHide(review)}>
                              <EyeOff aria-hidden className="size-4" />
                            </IconButton>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </Table>
        )}
        {reviews.data && list.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-fg-muted">{t.admin.reviews.total(reviews.data.totalElements)}</p>
            <Pagination page={reviews.data.page} totalPages={reviews.data.totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      {toHide && (
        <HideDialog
          review={toHide}
          onClose={() => setToHide(null)}
          onHidden={() => {
            setToHide(null);
            reviews.reload();
          }}
        />
      )}
    </div>
  );
}

function HideDialog({ review, onClose, onHidden }: { review: AdminReview; onClose: () => void; onHidden: () => void }) {
  const t = useT();
  const toast = useToast();
  const [reason, setReason] = useState<ReviewHiddenReason | "">("");
  const [note, setNote] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [noteError, setNoteError] = useState<string>();
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = note.trim();
    const missing = reason ? undefined : t.admin.validation.required;
    const tooLong = trimmed.length > NOTE_MAX ? t.admin.validation.tooLong(NOTE_MAX) : undefined;
    setReasonError(missing);
    setNoteError(tooLong);
    if (!reason || tooLong) return;
    setSaving(true);
    setFormError(null);
    try {
      await reviewApi.changeStatus(review.id, { status: "HIDDEN", reason, note: trimmed || undefined });
      toast.success(t.admin.reviews.hidden);
      onHidden();
    } catch (error) {
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.admin.reviews.hideTitle}
      description={t.admin.reviews.hideText}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="hide-review-form" variant="danger" size="md" loading={saving}>
            <EyeOff aria-hidden className="size-4" />
            {t.admin.reviews.hideConfirm}
          </Button>
        </>
      }
    >
      <form id="hide-review-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-fg">{review.user.fullName}</p>
            <Stars value={review.rating} className="size-3.5" />
          </div>
          <p className="text-xs font-medium text-fg-muted">{review.movie.title}</p>
          {review.comment && <p className="line-clamp-4 text-sm break-words whitespace-pre-line text-fg-2">{review.comment}</p>}
        </div>
        <SelectField
          label={t.admin.reviews.reason}
          required
          value={reason}
          onChange={(event) => {
            setReason(event.target.value as ReviewHiddenReason | "");
            setReasonError(undefined);
          }}
          error={reasonError}
        >
          <option value="">—</option>
          {REVIEW_HIDDEN_REASONS.map((value) => (
            <option key={value} value={value}>
              {t.reviews.hiddenReason[value]}
            </option>
          ))}
        </SelectField>
        <TextareaField
          label={t.admin.reviews.note}
          optional
          rows={3}
          value={note}
          maxLength={NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
          hint={`${t.admin.reviews.noteHint} ${note.length}/${NOTE_MAX}`}
          error={noteError}
        />
      </form>
    </Dialog>
  );
}
