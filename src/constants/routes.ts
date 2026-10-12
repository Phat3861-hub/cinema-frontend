/** Shared route paths, so URLs are never hard-coded across components. */
export const ROUTES = {
  home: "/",
  movies: "/movies",
  movieDetail: (slug: string) => `/movies/${slug}`,
  cinemas: "/cinemas",
  booking: (showtimeId: string | number) => `/booking/${showtimeId}`,
  myTickets: "/my-tickets",
  login: "/login",
  register: "/register",
  admin: {
    dashboard: "/admin",
    movies: "/admin/movies",
    showtimes: "/admin/showtimes",
    bookings: "/admin/bookings",
    users: "/admin/users",
  },
} as const;
