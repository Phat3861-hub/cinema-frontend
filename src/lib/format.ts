/** Business dates / times are shown in Vietnam time whatever the browser's zone (backend `app.time-zone`). */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** 90000 -> "90.000 ₫" (vi-VN) / "₫90,000" (en-GB). */
export function formatVnd(amount: number | string, intlLocale = "vi-VN"): string {
  return new Intl.NumberFormat(intlLocale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(amount),
  );
}

/** ISO instant or `yyyy-MM-dd` -> "31/10/2026". */
export function formatDate(value: string, intlLocale = "vi-VN"): string {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: isDateOnly(value) ? "UTC" : APP_TIME_ZONE,
  }).format(parse(value));
}

/** ISO instant -> "19:30" in Vietnam time. */
export function formatTime(value: string, intlLocale = "vi-VN"): string {
  return new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDateTime(value: string, intlLocale = "vi-VN"): string {
  return `${formatTime(value, intlLocale)} · ${formatDate(value, intlLocale)}`;
}

/** `yyyy-MM-dd` -> { weekday: "T7", day: "31", month: "10" } for the date strip. */
export function dayParts(date: string, intlLocale = "vi-VN") {
  const d = parse(date);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: "UTC" }).format(d);
  return { weekday: part({ weekday: "short" }), day: part({ day: "2-digit" }), month: part({ month: "2-digit" }) };
}

/** Today in Vietnam as `yyyy-MM-dd`. */
export function todayInVietnam(): string {
  return toIsoDate(new Date());
}

/** Instant -> its calendar day in Vietnam as `yyyy-MM-dd`. */
export function toIsoDate(instant: Date): string {
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(instant);
}

/** `yyyy-MM-dd` + n days. */
export function addDays(date: string, days: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Vietnam wall-clock date + time (`2026-10-31`, `19:30`) -> ISO instant (Vietnam is UTC+7, no DST). */
export function vietnamToInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

/** ISO instant -> `HH:mm` Vietnam wall-clock time, for <input type="time">. */
export function instantToVietnamTime(value: string): string {
  return formatTime(value, "en-GB");
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parse(value: string): Date {
  return isDateOnly(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
}
