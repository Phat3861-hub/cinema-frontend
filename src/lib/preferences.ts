/**
 * UI preferences kept in plain (non-HttpOnly) cookies: theme, locale, selected admin cinema.
 * Cookies rather than localStorage so the server could read them later; they never hold secrets.
 */

export type Theme = "light" | "dark";
export type Locale = "vi" | "en";

export const THEME_COOKIE = "theme";
export const LOCALE_COOKIE = "locale";
export const ADMIN_CINEMA_COOKIE = "admin_cinema";

export const DEFAULT_THEME: Theme = "dark";
export const DEFAULT_LOCALE: Locale = "vi";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/**
 * Runs in <head> before the first paint, so the page never flashes the wrong theme / language.
 * Keep it dependency-free: it is inlined as a string.
 */
export const PREFERENCES_SCRIPT = `(function(){try{var d=document.documentElement;var c=document.cookie;
var t=(c.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/)||[])[1]||"${DEFAULT_THEME}";
d.classList.toggle("dark",t==="dark");
var l=(c.match(/(?:^|; )${LOCALE_COOKIE}=(vi|en)/)||[])[1];if(l)d.lang=l;}catch(e){}})();`;
