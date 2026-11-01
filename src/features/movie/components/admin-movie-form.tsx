"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { SelectField } from "@/components/ui/select-field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { adminChecks, anyError, backendFieldErrors, optional, type Errors } from "@/features/admin/form-utils";
import { genreApi, movieApi } from "@/features/movie/api";
import { MovieStatusBadge } from "@/features/movie/components/movie-badges";
import { genreLabel } from "@/features/movie/labels";
import { AGE_RATINGS, type AgeRating, type Movie, type MovieRequest } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

type Field =
  | "title"
  | "description"
  | "durationMinutes"
  | "releaseDate"
  | "endDate"
  | "ageRating"
  | "language"
  | "country"
  | "director"
  | "castMembers"
  | "posterUrl"
  | "trailerUrl";

type Values = Record<Field, string>;

function toValues(movie?: Movie): Values {
  return {
    title: movie?.title ?? "",
    description: movie?.description ?? "",
    durationMinutes: movie ? String(movie.durationMinutes) : "",
    releaseDate: movie?.releaseDate ?? "",
    endDate: movie?.endDate ?? "",
    ageRating: movie?.ageRating ?? "P",
    language: movie?.language ?? "",
    country: movie?.country ?? "",
    director: movie?.director ?? "",
    castMembers: movie?.castMembers ?? "",
    posterUrl: movie?.posterUrl ?? "",
    trailerUrl: movie?.trailerUrl ?? "",
  };
}

/** `/admin/movies/new` and `/admin/movies/[id]`: loads the movie (edit) then shows the form. */
export function AdminMovieEditor({ movieId }: { movieId?: string }) {
  const movie = useApi(movieId ? `admin-movie:${movieId}` : null, () => movieApi.get(movieId!));
  if (movieId && movie.error) return <ErrorState error={movie.error} onRetry={movie.reload} />;
  if (movieId && !movie.data) return <LoadingState />;
  return <MovieForm movie={movie.data} />;
}

/** BankDash Setting form, 2 columns: poster preview on the left, fields on the right. */
function MovieForm({ movie }: { movie?: Movie }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const check = adminChecks(t);
  const genres = useApi("genres", genreApi.list);
  const [values, setValues] = useState<Values>(() => toValues(movie));
  const [genreIds, setGenreIds] = useState<number[]>(movie?.genres.map((g) => g.id) ?? []);
  const [errors, setErrors] = useState<Errors<Field | "genreIds">>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: Field) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  function validate(): Errors<Field | "genreIds"> {
    return {
      title: check.required(values.title) ?? check.maxLength(values.title, 255),
      description: check.maxLength(values.description, 5000),
      durationMinutes: check.intRange(values.durationMinutes, 1, 600),
      releaseDate: check.required(values.releaseDate),
      endDate:
        values.endDate && values.releaseDate && values.endDate < values.releaseDate
          ? t.admin.validation.endBeforeStart
          : undefined,
      language: check.maxLength(values.language, 50),
      country: check.maxLength(values.country, 50),
      director: check.maxLength(values.director, 255),
      castMembers: check.maxLength(values.castMembers, 2000),
      posterUrl: check.url(values.posterUrl),
      trailerUrl: check.url(values.trailerUrl),
      genreIds: genreIds.length === 0 ? t.admin.movies.genresRequired : genreIds.length > 10 ? t.admin.movies.genresMax : undefined,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (anyError(found)) return;

    const body: MovieRequest = {
      title: values.title.trim(),
      description: optional(values.description),
      durationMinutes: Number(values.durationMinutes),
      releaseDate: values.releaseDate,
      endDate: optional(values.endDate),
      ageRating: values.ageRating as AgeRating,
      language: optional(values.language),
      country: optional(values.country),
      director: optional(values.director),
      castMembers: optional(values.castMembers),
      posterUrl: optional(values.posterUrl),
      trailerUrl: optional(values.trailerUrl),
      genreIds,
    };
    setSaving(true);
    try {
      const saved = movie ? await movieApi.update(movie.id, body) : await movieApi.create(body);
      toast.success(movie ? t.admin.common.saved : t.admin.movies.created(saved.title));
      router.push(ROUTES.admin.movies);
    } catch (error) {
      setErrors(backendFieldErrors(error, t));
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.admin.movies} className={buttonClasses({ variant: "ghost", size: "md" })}>
          <ArrowLeft aria-hidden className="size-4" />
          {t.admin.movies.backToList}
        </Link>
        <div className="flex items-center gap-3">
          {movie && <MovieStatusBadge status={movie.status} />}
          <Button type="submit" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </div>
      </div>

      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-28">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-line bg-surface-3">
            <CoverImage src={values.posterUrl.trim() || null} alt={t.admin.movies.posterPreview} sizes="300px" />
          </div>
          <TextField
            label={t.admin.movies.posterUrl}
            optional
            size="md"
            type="url"
            placeholder="https://…"
            value={values.posterUrl}
            onChange={set("posterUrl")}
            error={errors.posterUrl}
          />
          {movie && (
            <p className="text-xs font-semibold text-fg-muted">
              {t.admin.movies.slug}: <code className="text-fg-2">{movie.slug}</code>
              <br />
              {t.admin.movies.slugHint}
            </p>
          )}
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField label={t.admin.movies.titleField} required value={values.title} onChange={set("title")} error={errors.title} />
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label={t.movie.synopsis}
              optional
              rows={5}
              value={values.description}
              onChange={set("description")}
              error={errors.description}
            />
          </div>
          <TextField
            label={t.admin.movies.durationField}
            required
            type="number"
            min={1}
            max={600}
            inputMode="numeric"
            value={values.durationMinutes}
            onChange={set("durationMinutes")}
            error={errors.durationMinutes}
          />
          <SelectField label={t.movie.ageRating} required value={values.ageRating} onChange={set("ageRating")}>
            {AGE_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating} – {t.movie.ageHint[rating]}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t.movie.releaseDate}
            required
            type="date"
            value={values.releaseDate}
            onChange={set("releaseDate")}
            error={errors.releaseDate}
          />
          <TextField
            label={t.admin.movies.endDate}
            optional
            type="date"
            value={values.endDate}
            min={values.releaseDate || undefined}
            onChange={set("endDate")}
            error={errors.endDate}
            hint={t.admin.movies.statusHint}
          />
          <TextField label={t.movie.language} optional value={values.language} onChange={set("language")} error={errors.language} />
          <TextField label={t.movie.country} optional value={values.country} onChange={set("country")} error={errors.country} />
          <TextField label={t.movie.director} optional value={values.director} onChange={set("director")} error={errors.director} />
          <TextField
            label={t.admin.movies.trailerUrl}
            optional
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={values.trailerUrl}
            onChange={set("trailerUrl")}
            error={errors.trailerUrl}
          />
          <div className="md:col-span-2">
            <TextareaField
              label={t.movie.cast}
              optional
              rows={2}
              hint={t.admin.movies.castHint}
              value={values.castMembers}
              onChange={set("castMembers")}
              error={errors.castMembers}
            />
          </div>
          <fieldset className="flex flex-col gap-3 md:col-span-2" aria-describedby={errors.genreIds ? "genre-error" : undefined}>
            <legend className="mb-2 text-sm font-medium">
              {t.movie.genre}
              <span aria-hidden className="text-danger">
                {" "}
                *
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {genres.data?.map((genre) => {
                const on = genreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setGenreIds((ids) => (on ? ids.filter((id) => id !== genre.id) : [...ids, genre.id]))}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                      on ? "border-primary bg-primary text-black" : "border-line-strong text-fg-2 hover:border-fg-subtle"
                    }`}
                  >
                    {on && <Check aria-hidden className="size-3.5" />}
                    {genreLabel(genre, t)}
                  </button>
                );
              })}
            </div>
            {errors.genreIds && (
              <p id="genre-error" className="text-xs font-medium text-danger">
                {errors.genreIds}
              </p>
            )}
          </fieldset>
        </Card>
      </div>
    </form>
  );
}
