import type {
  CinemaShowtimes,
  Showtime,
  ShowtimeAdminFilter,
  ShowtimeBulkRequest,
  ShowtimeRequest,
  ShowtimeSeatMap,
} from "@/features/showtime/types";
import { apiFetch } from "@/lib/api-client";

type Id = number | string;

/** Public schedule + staff management (SHOWTIME_MANAGE / PRICE_MANAGE / SEAT_BLOCK, checked per cinema). */
export const showtimeApi = {
  /** Showtimes still on sale for one Vietnam day. */
  list: (query: { cinemaId?: Id; movieId?: Id; date?: string }) => apiFetch<Showtime[]>("/showtimes", { query }),
  dates: (query: { cinemaId?: Id; movieId?: Id }) => apiFetch<string[]>("/showtimes/dates", { query }),
  get: (showtimeId: Id) => apiFetch<Showtime>(`/showtimes/${showtimeId}`),
  seats: (showtimeId: Id) => apiFetch<ShowtimeSeatMap>(`/showtimes/${showtimeId}/seats`),
  byMovie: (movieId: Id, query: { date?: string; city?: string }) =>
    apiFetch<CinemaShowtimes[]>(`/movies/${movieId}/showtimes`, { query }),

  forCinema: (cinemaId: Id, filter: ShowtimeAdminFilter) =>
    apiFetch<Showtime[]>(`/cinemas/${cinemaId}/showtimes`, { query: { ...filter } }),
  create: (cinemaId: Id, body: ShowtimeRequest) =>
    apiFetch<Showtime>(`/cinemas/${cinemaId}/showtimes`, { method: "POST", body }),
  createBulk: (cinemaId: Id, body: ShowtimeBulkRequest) =>
    apiFetch<Showtime[]>(`/cinemas/${cinemaId}/showtimes/bulk`, { method: "POST", body }),
  update: (showtimeId: Id, body: ShowtimeRequest) =>
    apiFetch<Showtime>(`/showtimes/${showtimeId}`, { method: "PUT", body }),
  cancel: (showtimeId: Id) => apiFetch<Showtime>(`/showtimes/${showtimeId}/cancel`, { method: "PATCH" }),
  setSeatBlocked: (showtimeId: Id, seatId: Id, blocked: boolean) =>
    apiFetch<ShowtimeSeatMap>(`/showtimes/${showtimeId}/seats/${seatId}`, { method: "PATCH", body: { blocked } }),
};
