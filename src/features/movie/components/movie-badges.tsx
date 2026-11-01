"use client";

import { Star } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { AgeRating, MovieStatus } from "@/features/movie/types";
import { useT } from "@/i18n";

/** P green, K blue, T13 yellow, T16 orange, T18 red – always with the code as text (docs/ui-design.md §3). */
const AGE_TONES: Record<AgeRating, BadgeTone> = {
  P: "success",
  K: "info",
  T13: "primary",
  T16: "warning",
  T18: "danger",
};

export function AgeBadge({ rating, withLabel = false }: { rating: AgeRating; withLabel?: boolean }) {
  const t = useT();
  return (
    <Badge tone={AGE_TONES[rating]}>
      <span title={t.movie.ageHint[rating]}>{rating}</span>
      {withLabel && <span className="font-medium">· {t.movie.ageHint[rating]}</span>}
    </Badge>
  );
}

const STATUS_TONES: Record<MovieStatus, BadgeTone> = {
  NOW_SHOWING: "success",
  COMING_SOON: "info",
  ENDED: "neutral",
};

export function MovieStatusBadge({ status }: { status: MovieStatus }) {
  const t = useT();
  return <Badge tone={STATUS_TONES[status]}>{t.movie.status[status]}</Badge>;
}

/** 1–5 stars average; hidden when there is no rating yet. */
export function Rating({ value }: { value: number | null }) {
  const t = useT();
  if (value === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-fg" aria-label={t.movie.ratingLabel(Number(value))}>
      <Star aria-hidden className="size-4 fill-primary text-primary" />
      {Number(value).toFixed(1)}
    </span>
  );
}
