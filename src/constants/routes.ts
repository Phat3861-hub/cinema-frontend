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
  registerCheckEmail: "/register/check-email",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  admin: {
    dashboard: "/admin",
    movies: "/admin/movies",
    showtimes: "/admin/showtimes",
    bookings: "/admin/bookings",
    users: "/admin/users",
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
