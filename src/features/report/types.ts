/** Confirmed sales: `ticketRevenue + productRevenue - discount = revenue` (a voucher applies to the whole order). */
export interface ReportSales {
  bookings: number;
  tickets: number;
  revenue: number;
  ticketRevenue: number;
  productRevenue: number;
  discount: number;
}

/** Seats of the showtimes held on the period's days; `rate` is 0–1, null without seats. */
export interface ReportOccupancy {
  showtimes: number;
  soldSeats: number;
  sellableSeats: number;
  rate: number | null;
}

export type ReportChannel = "ONLINE" | "COUNTER";

export interface ReportPeriodSummary {
  from: string;
  to: string;
  sales: ReportSales;
  averageTicketPrice: number | null;
  occupancy: ReportOccupancy;
  /** Always ONLINE then COUNTER. */
  channels: { channel: ReportChannel; sales: ReportSales }[];
}

export interface ReportSummary {
  current: ReportPeriodSummary;
  /** The period of the same length just before `current`. */
  previous: ReportPeriodSummary;
}

export interface ReportDay {
  date: string;
  sales: ReportSales;
}

export interface ReportMovie {
  movieId: number;
  title: string;
  slug: string;
  sales: ReportSales;
  occupancy: ReportOccupancy;
}

export interface ReportCinema {
  cinemaId: number;
  name: string;
  city: string;
  sales: ReportSales;
  occupancy: ReportOccupancy;
}

export interface ReportProducts {
  products: { productId: number; name: string; category: string; quantity: number; revenue: number }[];
  categories: { category: string; quantity: number; revenue: number }[];
}

/** Days are `yyyy-MM-dd` in Vietnam time, 92 at most; without `cinemaId` the report covers every cinema. */
export interface ReportFilter {
  from?: string;
  to?: string;
  cinemaId?: number;
}
