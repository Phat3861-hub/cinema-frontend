import type {
  Cinema,
  CinemaFilter,
  CinemaRequest,
  CinemaStaff,
  Room,
  RoomCreateRequest,
  RoomUpdateRequest,
  SeatLayout,
  SeatType,
} from "@/features/cinema/types";
import { apiFetch } from "@/lib/api-client";

type Id = number | string;

/** `/api/v1/cinemas`, rooms, seat layout, seat types, cinema staff. Per-cinema checks may answer 403. */
export const cinemaApi = {
  list: (filter: CinemaFilter = {}) => apiFetch<Cinema[]>("/cinemas", { query: { ...filter } }),
  cities: () => apiFetch<string[]>("/cinemas/cities"),
  managed: () => apiFetch<Cinema[]>("/cinemas/managed"),
  get: (cinemaId: Id) => apiFetch<Cinema>(`/cinemas/${cinemaId}`),
  bySlug: (slug: string) => apiFetch<Cinema>(`/cinemas/slug/${encodeURIComponent(slug)}`),
  create: (body: CinemaRequest) => apiFetch<Cinema>("/cinemas", { method: "POST", body }),
  update: (cinemaId: Id, body: CinemaRequest) => apiFetch<Cinema>(`/cinemas/${cinemaId}`, { method: "PUT", body }),
  remove: (cinemaId: Id) => apiFetch<void>(`/cinemas/${cinemaId}`, { method: "DELETE" }),
};

export const roomApi = {
  list: (cinemaId: Id) => apiFetch<Room[]>(`/cinemas/${cinemaId}/rooms`),
  create: (cinemaId: Id, body: RoomCreateRequest) =>
    apiFetch<Room>(`/cinemas/${cinemaId}/rooms`, { method: "POST", body }),
  get: (roomId: Id) => apiFetch<Room>(`/rooms/${roomId}`),
  update: (roomId: Id, body: RoomUpdateRequest) => apiFetch<Room>(`/rooms/${roomId}`, { method: "PUT", body }),
  remove: (roomId: Id) => apiFetch<void>(`/rooms/${roomId}`, { method: "DELETE" }),
  layout: (roomId: Id) => apiFetch<SeatLayout>(`/rooms/${roomId}/layout`),
  saveLayout: (roomId: Id, grid: string[]) =>
    apiFetch<SeatLayout>(`/rooms/${roomId}/layout`, { method: "PUT", body: { grid } }),
  setSeatActive: (roomId: Id, seatId: Id, active: boolean) =>
    apiFetch<SeatLayout>(`/rooms/${roomId}/seats/${seatId}`, { method: "PATCH", body: { active } }),
};

export const seatTypeApi = {
  list: () => apiFetch<SeatType[]>("/seat-types"),
  update: (seatTypeId: Id, body: { name: string; surcharge: number; color?: string }) =>
    apiFetch<SeatType>(`/seat-types/${seatTypeId}`, { method: "PUT", body }),
};

export const staffApi = {
  list: (cinemaId: Id) => apiFetch<CinemaStaff[]>(`/cinemas/${cinemaId}/staff`),
  add: (cinemaId: Id, email: string) =>
    apiFetch<CinemaStaff>(`/cinemas/${cinemaId}/staff`, { method: "POST", body: { email } }),
  remove: (cinemaId: Id, userId: Id) => apiFetch<void>(`/cinemas/${cinemaId}/staff/${userId}`, { method: "DELETE" }),
};
