/** Mirrors com.pnt.cinema.modules.movie (MovieStatus, AgeRating, DTOs). Dates are `yyyy-MM-dd`. */
export type MovieStatus = "COMING_SOON" | "NOW_SHOWING" | "ENDED";
export type AgeRating = "P" | "K" | "T13" | "T16" | "T18";

export const AGE_RATINGS: AgeRating[] = ["P", "K", "T13", "T16", "T18"];
export const MOVIE_STATUSES: MovieStatus[] = ["NOW_SHOWING", "COMING_SOON", "ENDED"];

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

/** MovieSummaryResponse – list items. */
export interface MovieSummary {
  id: number;
  title: string;
  slug: string;
  durationMinutes: number;
  releaseDate: string;
  endDate: string | null;
  ageRating: AgeRating;
  posterUrl: string | null;
  status: MovieStatus;
  avgRating: number | null;
  /** Visible reviews counted in `avgRating`. */
  ratingCount: number;
  genres: Genre[];
}

/** MovieResponse – detail. */
export interface Movie extends MovieSummary {
  description: string | null;
  language: string | null;
  country: string | null;
  director: string | null;
  castMembers: string | null;
  trailerUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovieRequest {
  title: string;
  description?: string;
  durationMinutes: number;
  releaseDate: string;
  endDate?: string;
  ageRating: AgeRating;
  language?: string;
  country?: string;
  director?: string;
  castMembers?: string;
  posterUrl?: string;
  trailerUrl?: string;
  genreIds: number[];
}

export interface MovieFilter {
  status?: MovieStatus;
  genre?: string;
  ageRating?: AgeRating;
  language?: string;
  keyword?: string;
  page?: number;
  size?: number;
  /** e.g. `releaseDate,desc` – allowed: title, releaseDate, durationMinutes, avgRating, createdAt. */
  sort?: string;
}

/** Reviews (MOV-05 / MOV-06). */
export type ReviewStatus = "VISIBLE" | "HIDDEN";
export type ReviewHiddenReason = "SPOILER" | "OFFENSIVE" | "SPAM" | "OTHER";

export const REVIEW_STATUSES: ReviewStatus[] = ["VISIBLE", "HIDDEN"];
export const REVIEW_HIDDEN_REASONS: ReviewHiddenReason[] = ["SPOILER", "OFFENSIVE", "SPAM", "OTHER"];
export const REVIEW_COMMENT_MAX = 1000;

/** ReviewResponse – public list item (author's name only). */
export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

/** MyReviewResponse – the author's own review, hidden ones too. */
export interface MyReview {
  id: number;
  movieId: number;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  hiddenReason: ReviewHiddenReason | null;
  hiddenNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibility {
  canReview: boolean;
  reason: "NOT_WATCHED" | "ALREADY_REVIEWED" | null;
  review: MyReview | null;
}

export interface ReviewSummary {
  /** null without reviews. */
  average: number | null;
  count: number;
  /** 5 → 1. */
  distribution: { stars: number; count: number }[];
}

export interface ReviewRequest {
  rating: number;
  comment?: string;
}

/** AdminReviewResponse – moderation list. */
export interface AdminReview {
  id: number;
  movie: { id: number; slug: string; title: string };
  user: { id: number; fullName: string; email: string };
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  hiddenReason: ReviewHiddenReason | null;
  hiddenNote: string | null;
  hiddenByName: string | null;
  hiddenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilter {
  status?: ReviewStatus;
  movieId?: number;
  rating?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ReviewStatusRequest {
  status: ReviewStatus;
  reason?: ReviewHiddenReason;
  note?: string;
}
