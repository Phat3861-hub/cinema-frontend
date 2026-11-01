/** Mirrors com.pnt.cinema.modules.cinema DTOs. */
export type CinemaStatus = "ACTIVE" | "INACTIVE";
export type RoomType = "2D" | "3D" | "IMAX" | "4DX";
export type RoomStatus = "ACTIVE" | "MAINTENANCE";
/** Seat type codes; the grid uses S / V / C and `.` for an aisle. */
export type SeatTypeCode = "STANDARD" | "VIP" | "COUPLE";

export const ROOM_TYPES: RoomType[] = ["2D", "3D", "IMAX", "4DX"];

export interface Cinema {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  status: CinemaStatus;
  /** Only when the list was asked with `lat` + `lng`. */
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CinemaRequest {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  status?: CinemaStatus;
}

export interface CinemaFilter {
  city?: string;
  keyword?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface Room {
  id: number;
  cinemaId: number;
  name: string;
  roomType: RoomType;
  totalRows: number;
  totalColumns: number;
  status: RoomStatus;
  /** Seats that can be sold (active). */
  seatCount: number;
  createdAt: string;
}

export interface RoomCreateRequest {
  name: string;
  roomType: RoomType;
  grid: string[];
}

export interface RoomUpdateRequest {
  name: string;
  roomType: RoomType;
  status: RoomStatus;
}

export interface SeatType {
  id: number;
  code: SeatTypeCode;
  name: string;
  surcharge: number;
  color: string | null;
}

export interface Seat {
  id: number;
  rowLabel: string;
  columnNumber: number;
  seatCode: string;
  seatType: SeatTypeCode;
  pairedSeatId: number | null;
  active: boolean;
}

export interface SeatLayout {
  roomId: number;
  totalRows: number;
  totalColumns: number;
  grid: string[];
  seats: Seat[];
  seatTypes: SeatType[];
}

/** CinemaStaffResponse. */
export interface CinemaStaff {
  userRoleId: number;
  userId: number;
  email: string;
  fullName: string;
  status: "PENDING" | "ACTIVE" | "LOCKED";
  roleCode: string;
  assignedAt: string;
}
