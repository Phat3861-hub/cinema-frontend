import type { RoomType, SeatType, SeatTypeCode } from "@/features/cinema/types";
import type { AgeRating } from "@/features/movie/types";

/** Mirrors com.pnt.cinema.modules.showtime DTOs. Instants are ISO UTC; show them in Vietnam time. */
export type ShowtimeStatus = "SCHEDULED" | "OPEN" | "FINISHED" | "CANCELLED";
export type AudioType = "SUBTITLED" | "DUBBED" | "ORIGINAL";
export type ShowtimeSeatStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";

export const AUDIO_TYPES: AudioType[] = ["SUBTITLED", "DUBBED", "ORIGINAL"];
export const SHOWTIME_STATUSES: ShowtimeStatus[] = ["OPEN", "SCHEDULED", "FINISHED", "CANCELLED"];

export interface Showtime {
  id: number;
  movie: { id: number; title: string; slug: string; posterUrl: string | null; durationMinutes: number; ageRating: AgeRating };
  cinema: { id: number; name: string; slug: string; address: string; city: string };
  room: { id: number; name: string; roomType: RoomType };
  startTime: string;
  endTime: string;
  format: RoomType;
  audioType: AudioType;
  basePrice: number;
  status: ShowtimeStatus;
  totalSeats: number;
  availableSeats: number;
}

/** MOV-03: one cinema with its showtimes of the day. */
export interface CinemaShowtimes {
  cinema: Showtime["cinema"];
  showtimes: Showtime[];
}

export interface ShowtimeSeat {
  seatId: number;
  rowLabel: string;
  columnNumber: number;
  seatCode: string;
  seatType: SeatTypeCode;
  pairedSeatId: number | null;
  status: ShowtimeSeatStatus;
  price: number;
}

export interface ShowtimeSeatMap {
  showtimeId: number;
  showtimeStatus: ShowtimeStatus;
  totalRows: number;
  totalColumns: number;
  seats: ShowtimeSeat[];
  seatTypes: SeatType[];
}

export interface ShowtimeRequest {
  movieId: number;
  roomId: number;
  startTime: string;
  format?: RoomType;
  audioType: AudioType;
  basePrice: number;
}

export interface ShowtimeBulkRequest {
  movieId: number;
  roomId: number;
  /** Vietnam dates / wall-clock times. */
  fromDate: string;
  toDate: string;
  startTimes: string[];
  format?: RoomType;
  audioType: AudioType;
  basePrice: number;
}

/** `data` of a 409 SHOWTIME_OVERLAP. */
export interface ShowtimeConflict {
  startTime: string;
  endTime: string;
  conflictingShowtimeId: number;
}

export interface ShowtimeAdminFilter {
  from?: string;
  to?: string;
  roomId?: number;
  movieId?: number;
  status?: ShowtimeStatus;
}
