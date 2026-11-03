import type {
  AdminReview,
  Genre,
  Movie,
  MovieFilter,
  MovieRequest,
  MovieSummary,
  MyReview,
  Review,
  ReviewEligibility,
  ReviewFilter,
  ReviewRequest,
  ReviewStatusRequest,
  ReviewSummary,
} from "@/features/movie/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

/** `/api/v1/movies`, `/api/v1/genres` – reads are public, writes need MOVIE_MANAGE / GENRE_MANAGE. */
export const movieApi = {
  search: (filter: MovieFilter = {}) => apiFetch<PageResponse<MovieSummary>>("/movies", { query: { ...filter } }),
  get: (movieId: number | string) => apiFetch<Movie>(`/movies/${movieId}`),
  bySlug: (slug: string) => apiFetch<Movie>(`/movies/slug/${encodeURIComponent(slug)}`),
  create: (body: MovieRequest) => apiFetch<Movie>("/movies", { method: "POST", body }),
  update: (movieId: number, body: MovieRequest) => apiFetch<Movie>(`/movies/${movieId}`, { method: "PUT", body }),
  remove: (movieId: number) => apiFetch<void>(`/movies/${movieId}`, { method: "DELETE" }),
};

export const genreApi = {
  list: () => apiFetch<Genre[]>("/genres"),
  create: (name: string) => apiFetch<Genre>("/genres", { method: "POST", body: { name } }),
  update: (genreId: number, name: string) => apiFetch<Genre>(`/genres/${genreId}`, { method: "PUT", body: { name } }),
  remove: (genreId: number) => apiFetch<void>(`/genres/${genreId}`, { method: "DELETE" }),
};

/** Movie reviews: reading is public, writing needs REVIEW_CREATE (customers), moderating REVIEW_MODERATE. */
export const reviewApi = {
  /** Visible reviews, newest first. */
  list: (movieId: number, query: { rating?: number; page?: number; size?: number } = {}) =>
    apiFetch<PageResponse<Review>>(`/movies/${movieId}/reviews`, { query: { ...query } }),
  summary: (movieId: number) => apiFetch<ReviewSummary>(`/movies/${movieId}/reviews/summary`),
  /** The signed-in user's review of the movie and whether they may write one. */
  mine: (movieId: number) => apiFetch<ReviewEligibility>("/reviews/me", { query: { movieId } }),
  create: (movieId: number, body: ReviewRequest) =>
    apiFetch<MyReview>(`/movies/${movieId}/reviews`, { method: "POST", body }),
  /** `REVIEW_HIDDEN` once a moderator hid it. */
  update: (reviewId: number, body: ReviewRequest) => apiFetch<MyReview>(`/reviews/${reviewId}`, { method: "PUT", body }),
  remove: (reviewId: number) => apiFetch<void>(`/reviews/${reviewId}`, { method: "DELETE" }),
  /** Every review, newest first. */
  moderate: (filter: ReviewFilter) => apiFetch<PageResponse<AdminReview>>("/reviews", { query: { ...filter } }),
  changeStatus: (reviewId: number, body: ReviewStatusRequest) =>
    apiFetch<AdminReview>(`/reviews/${reviewId}/status`, { method: "PATCH", body }),
};
