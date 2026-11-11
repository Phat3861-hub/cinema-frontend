"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { TextField } from "@/components/ui/text-field";
import { adminChecks, type Errors } from "@/features/admin/form-utils";
import { ImageUploadField } from "@/features/media/components/image-upload-field";
import { splitCast } from "@/features/movie/labels";
import type { Movie, MovieRequest } from "@/features/movie/types";
import { useT } from "@/i18n";
import type { Messages } from "@/i18n/messages/vi";

/** Limits of MovieRequest.images / .cast (backend @Size). */
export const MAX_IMAGES = 20;
export const MAX_CAST = 30;

export interface ImageRow {
  key: number;
  url: string;
  caption: string;
}

export interface CastRow {
  key: number;
  name: string;
  character: string;
  photoUrl: string;
}

/** Errors of the rows, keyed `images.<row key>.<field>` / `cast.<row key>.<field>` (they follow a row when it moves). */
export type MediaErrors = Errors<string>;

let lastKey = 0;
const nextKey = () => ++lastKey;

export function toImageRows(movie?: Movie): ImageRow[] {
  return (movie?.images ?? []).map((image) => ({ key: nextKey(), url: image.url, caption: image.caption ?? "" }));
}

/** The structured cast, or – for movies saved before it existed – the names of the `castMembers` text. */
export function toCastRows(movie?: Movie): CastRow[] {
  if (movie && movie.cast.length > 0) {
    return movie.cast.map((member) => ({
      key: nextKey(),
      name: member.name,
      character: member.character ?? "",
      photoUrl: member.photoUrl ?? "",
    }));
  }
  return splitCast(movie?.castMembers ?? null)
    .slice(0, MAX_CAST)
    .map((name) => ({ key: nextKey(), name, character: "", photoUrl: "" }));
}

export function validateMedia(images: ImageRow[], cast: CastRow[], t: Messages): MediaErrors {
  const check = adminChecks(t);
  const errors: MediaErrors = {};
  images.forEach((row) => {
    errors[`images.${row.key}.url`] = check.required(row.url) ?? check.url(row.url) ?? check.maxLength(row.url, 500);
    errors[`images.${row.key}.caption`] = check.maxLength(row.caption, 255);
  });
  cast.forEach((row) => {
    errors[`cast.${row.key}.name`] = check.required(row.name) ?? check.maxLength(row.name, 255);
    errors[`cast.${row.key}.character`] = check.maxLength(row.character, 255);
    errors[`cast.${row.key}.photoUrl`] = check.url(row.photoUrl) ?? check.maxLength(row.photoUrl, 500);
  });
  return errors;
}

const blankToUndefined = (value: string) => value.trim() || undefined;

export function toMediaRequest(images: ImageRow[], cast: CastRow[]): Pick<MovieRequest, "images" | "cast"> {
  return {
    images: images.map((row) => ({ url: row.url.trim(), caption: blankToUndefined(row.caption) })),
    cast: cast.map((row) => ({
      name: row.name.trim(),
      character: blankToUndefined(row.character),
      photoUrl: blankToUndefined(row.photoUrl),
    })),
  };
}

function move<T>(rows: T[], from: number, to: number): T[] {
  const next = [...rows];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

/** Card with a title, the ordered rows and an "Add" button. */
function ListCard({
  title,
  hint,
  empty,
  addLabel,
  canAdd,
  onAdd,
  children,
}: {
  title: string;
  hint: string;
  empty: string;
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  children: ReactNode[];
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-h8">{title}</h2>
          <p className="mt-1 text-sm font-medium text-fg-muted">{hint}</p>
        </div>
        <Button type="button" variant="outline" size="md" onClick={onAdd} disabled={!canAdd}>
          <Plus aria-hidden className="size-4" />
          {addLabel}
        </Button>
      </div>
      {children.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm font-medium text-fg-muted">
          {empty}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">{children}</ol>
      )}
    </Card>
  );
}

/** One ordered row: its name with up / down / remove buttons on top, the fields below. */
function RowCard({
  item,
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  item: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const t = useT();
  const iconButton =
    "flex size-9 cursor-pointer items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-bold text-fg-2">
          {index + 1}. {item}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={iconButton}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
            aria-label={t.admin.movies.moveUp(item)}
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            disabled={index === count - 1}
            onClick={() => onMove(index + 1)}
            aria-label={t.admin.movies.moveDown(item)}
          >
            <ArrowDown aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={`${iconButton} hover:text-danger`}
            onClick={onRemove}
            aria-label={t.admin.movies.remove(item)}
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">{children}</div>
    </li>
  );
}

/** Gallery stills of the movie form: URL (or upload) + caption per image, ordered. */
export function GalleryEditor({
  rows,
  onChange,
  errors,
}: {
  rows: ImageRow[];
  onChange: (rows: ImageRow[]) => void;
  errors: MediaErrors;
}) {
  const t = useT();
  const update = (index: number, patch: Partial<ImageRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <ListCard
      title={t.admin.movies.galleryTitle}
      hint={t.admin.movies.galleryHint(MAX_IMAGES)}
      empty={t.admin.movies.galleryEmpty}
      addLabel={t.admin.movies.addImage}
      canAdd={rows.length < MAX_IMAGES}
      onAdd={() => onChange([...rows, { key: nextKey(), url: "", caption: "" }])}
    >
      {rows.map((row, index) => {
        const item = t.admin.movies.imageN(index + 1);
        return (
          <RowCard
            key={row.key}
            item={item}
            index={index}
            count={rows.length}
            onMove={(to) => onChange(move(rows, index, to))}
            onRemove={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded border border-line bg-surface-3 sm:w-44">
              <CoverImage src={row.url.trim() || null} alt={item} sizes="176px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <ImageUploadField
                purpose="MOVIE_IMAGE"
                label={t.admin.movies.imageUrl}
                required
                value={row.url}
                onChange={(url) => update(index, { url })}
                error={errors[`images.${row.key}.url`]}
              />
              <TextField
                label={t.admin.movies.caption}
                optional
                size="md"
                maxLength={255}
                value={row.caption}
                onChange={(e) => update(index, { caption: e.target.value })}
                error={errors[`images.${row.key}.caption`]}
              />
            </div>
          </RowCard>
        );
      })}
    </ListCard>
  );
}

/** Actors of the movie form: name, character and photo per actor, ordered. */
export function CastEditor({
  rows,
  onChange,
  errors,
}: {
  rows: CastRow[];
  onChange: (rows: CastRow[]) => void;
  errors: MediaErrors;
}) {
  const t = useT();
  const update = (index: number, patch: Partial<CastRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <ListCard
      title={t.movie.cast}
      hint={t.admin.movies.castHint(MAX_CAST)}
      empty={t.admin.movies.castEmpty}
      addLabel={t.admin.movies.addActor}
      canAdd={rows.length < MAX_CAST}
      onAdd={() => onChange([...rows, { key: nextKey(), name: "", character: "", photoUrl: "" }])}
    >
      {rows.map((row, index) => {
        const item = row.name.trim() || t.admin.movies.actorN(index + 1);
        return (
          <RowCard
            key={row.key}
            item={item}
            index={index}
            count={rows.length}
            onMove={(to) => onChange(move(rows, index, to))}
            onRemove={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-line bg-surface-3 sm:size-20">
              {row.photoUrl.trim() ? (
                <CoverImage src={row.photoUrl.trim()} alt={item} sizes="80px" />
              ) : (
                <UserRound aria-hidden className="absolute inset-0 m-auto size-8 text-fg-subtle" strokeWidth={1.5} />
              )}
            </div>
            <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
              <TextField
                label={t.admin.movies.actorName}
                required
                size="md"
                maxLength={255}
                value={row.name}
                onChange={(e) => update(index, { name: e.target.value })}
                error={errors[`cast.${row.key}.name`]}
              />
              <TextField
                label={t.admin.movies.character}
                optional
                size="md"
                maxLength={255}
                value={row.character}
                onChange={(e) => update(index, { character: e.target.value })}
                error={errors[`cast.${row.key}.character`]}
              />
              <div className="md:col-span-2">
                <ImageUploadField
                  purpose="MOVIE_IMAGE"
                  label={t.admin.movies.photo}
                  optional
                  value={row.photoUrl}
                  onChange={(photoUrl) => update(index, { photoUrl })}
                  error={errors[`cast.${row.key}.photoUrl`]}
                />
              </div>
            </div>
          </RowCard>
        );
      })}
    </ListCard>
  );
}
