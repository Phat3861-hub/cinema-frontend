type Id = string | number;

/** Shared route paths, so URLs are never hard-coded across components. */
export const ROUTES = {
  home: "/",
  movies: "/movies",
  movieDetail: (slug: string) => `/movies/${slug}`,
  cinemas: "/cinemas",
  cinemaDetail: (slug: string) => `/cinemas/${slug}`,
  offers: "/offers",
  booking: (showtimeId: Id) => `/booking/${showtimeId}`,
  myTickets: "/my-tickets",
  myTicket: (bookingId: Id) => `/my-tickets/${bookingId}`,
  notifications: "/notifications",
  points: "/points",
  account: "/account",
  login: "/login",
  register: "/register",
  registerCheckEmail: "/register/check-email",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  admin: {
    dashboard: "/admin",
    pos: "/admin/pos",
    checkIn: "/admin/check-in",
    bookings: "/admin/bookings",
    refunds: "/admin/refunds",
    movies: "/admin/movies",
    movieNew: "/admin/movies/new",
    movieEdit: (movieId: Id) => `/admin/movies/${movieId}`,
    genres: "/admin/genres",
    banners: "/admin/banners",
    reviews: "/admin/reviews",
    cinemas: "/admin/cinemas",
    cinemaNew: "/admin/cinemas/new",
    cinemaEdit: (cinemaId: Id) => `/admin/cinemas/${cinemaId}`,
    /** Landing pages of the per-cinema screens: they redirect to the selected cinema. */
    rooms: "/admin/rooms",
    cinemaRooms: (cinemaId: Id) => `/admin/cinemas/${cinemaId}/rooms`,
    roomLayout: (roomId: Id) => `/admin/rooms/${roomId}/layout`,
    seatTypes: "/admin/seat-types",
    showtimes: "/admin/showtimes",
    cinemaShowtimes: (cinemaId: Id) => `/admin/cinemas/${cinemaId}/showtimes`,
    staff: "/admin/staff",
    cinemaStaff: (cinemaId: Id) => `/admin/cinemas/${cinemaId}/staff`,
    vouchers: "/admin/vouchers",
    products: "/admin/products",
    reports: "/admin/reports",
    users: "/admin/users",
    userDetail: (userId: Id) => `/admin/users/${userId}`,
    roles: "/admin/roles",
    auditLogs: "/admin/audit-logs",
  },
} as const;

/** `path?key=value` with the empty values dropped. */
export function withQuery(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
