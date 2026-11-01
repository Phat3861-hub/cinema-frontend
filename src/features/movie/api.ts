import type { Genre, Movie, MovieFilter, MovieRequest, MovieSummary } from "@/features/movie/types";
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
