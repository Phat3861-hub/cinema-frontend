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
