"use client";

import { ArrowRight, Building2, CalendarClock, Clapperboard, Film, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { visibleMenu } from "@/features/admin/menu";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny, roleLabel } from "@/features/auth/permissions";
import { movieApi } from "@/features/movie/api";
import { showtimeApi } from "@/features/showtime/api";
import type { Showtime } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useNow } from "@/hooks/use-now";
import { useLocale, useT } from "@/i18n";
import { addDays, dayParts, formatTime, toIsoDate, todayInVietnam } from "@/lib/format";

const SHOWTIME_READ = ["SHOWTIME_MANAGE", "PRICE_MANAGE", "SEAT_BLOCK"];

/**
 * Admin home (BankDash Dashboard): greeting + roles, stat tiles from the APIs that exist, the selected cinema's
 * showtimes over the next 7 days and shortcuts to every screen the user may open. Revenue reports wait for SYS-03.
 */
export function DashboardScreen() {
  const t = useT();
  const { user } = useSession();
  const { selected, cinemas } = useAdminCinema();
  if (!user) return null;

  const canShowtimes = hasAny(user, SHOWTIME_READ) && !!selected;
  const shortcuts = visibleMenu(user.permissions)
    .flatMap((group) => group.items)
    .filter((item) => item.href !== ROUTES.admin.dashboard);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-h8 sm:text-xl sm:font-bold">{t.admin.dashboard.hello(user.fullName)}</p>
          <p className="text-sm font-medium text-fg-muted">{t.admin.dashboard.intro}</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {user.roles.map((role) => (
            <li key={role.id}>
              <Badge tone="accent">
                {roleLabel(role, t)}
                {role.scopeType === "CINEMA" && (
                  <span className="font-medium">
                    · {cinemas.find((c) => c.id === role.cinemaId)?.name ?? `#${role.cinemaId}`}
                  </span>
                )}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <StatTiles canShowtimes={canShowtimes} />

      {canShowtimes && selected && <WeekChart cinemaId={selected.id} cinemaName={selected.name} />}

      <section aria-labelledby="shortcuts-title" className="flex flex-col gap-4">
        <SectionHeader title={<span id="shortcuts-title">{t.admin.dashboard.shortcuts}</span>} />
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-black">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{t.admin.menu[item.key]}</span>
                    {item.soon && <span className="text-xs font-semibold text-fg-subtle">{t.common.comingSoon}</span>}
                  </span>
                  <ArrowRight aria-hidden className="size-4 text-fg-subtle transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function StatTiles({ canShowtimes }: { canShowtimes: boolean }) {
  const t = useT();
  const { cinemas, selected } = useAdminCinema();
  const today = todayInVietnam();
  const nowShowing = useApi("dash:now", () => movieApi.search({ status: "NOW_SHOWING", size: 1 }));
  const comingSoon = useApi("dash:soon", () => movieApi.search({ status: "COMING_SOON", size: 1 }));
  const todayShows = useApi(canShowtimes && selected ? `dash:today:${selected.id}:${today}` : null, () =>
    showtimeApi.forCinema(selected!.id, { from: today, to: today }),
  );

  const tiles: { icon: LucideIcon; label: string; value?: number; loading: boolean }[] = [
    { icon: Film, label: t.admin.dashboard.nowShowing, value: nowShowing.data?.totalElements, loading: nowShowing.loading },
    { icon: Clapperboard, label: t.admin.dashboard.comingSoon, value: comingSoon.data?.totalElements, loading: comingSoon.loading },
    { icon: Building2, label: t.admin.dashboard.cinemas, value: cinemas.length, loading: false },
  ];
  if (canShowtimes) {
    tiles.push({
      icon: CalendarClock,
      label: t.admin.dashboard.todayShowtimes,
      value: todayShows.data?.filter((s) => s.status !== "CANCELLED").length,
      loading: todayShows.loading,
    });
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ icon: Icon, label, value, loading }) => (
        <li key={label}>
          <Card className="flex items-center gap-4 p-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon aria-hidden className="size-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg-muted">{label}</p>
              {loading && value === undefined ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{value ?? "—"}</p>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Bar chart: showtimes per day for the next 7 days (single series → no legend; values labelled, table for SR). */
function WeekChart({ cinemaId, cinemaName }: { cinemaId: number; cinemaName: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [hover, setHover] = useState<string | null>(null);
  const now = useNow();
  const today = todayInVietnam();
  const to = addDays(today, 6);
  const { data, error, loading, reload } = useApi(`dash:week:${cinemaId}:${today}`, () =>
    showtimeApi.forCinema(cinemaId, { from: today, to }),
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const active = (data ?? []).filter((s) => s.status !== "CANCELLED");
  const counts = days.map((day) => active.filter((s) => toIsoDate(new Date(s.startTime)) === day).length);
  const max = Math.max(1, ...counts);
  const upcoming = active
    .filter((s) => new Date(s.startTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 6);

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <Card className="flex flex-col gap-5 p-6">
        <SectionHeader title={t.admin.dashboard.weekChart} description={cinemaName} />
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <>
            <div className="flex h-56 items-end gap-3 border-b border-line pt-6" role="img" aria-label={t.admin.dashboard.weekChart}>
              {days.map((day, i) => {
                const { weekday, day: dd } = dayParts(day, intlLocale);
                const pct = (counts[i] / max) * 100;
                return (
                  <div
                    key={day}
                    className="relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                    onMouseEnter={() => setHover(day)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {hover === day && (
                      <span className="absolute -top-2 z-10 rounded border border-line bg-surface px-2 py-1 text-xs font-semibold whitespace-nowrap shadow-lg">
                        {weekday} {dd}: {t.admin.dashboard.showtimeCount(counts[i])}
                      </span>
                    )}
                    <span className="text-xs font-bold text-fg-2">{counts[i]}</span>
                    <span
                      className={`w-full max-w-10 rounded-t transition-opacity ${counts[i] ? "bg-accent" : "bg-line"} ${hover && hover !== day ? "opacity-50" : ""}`}
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3" aria-hidden>
              {days.map((day) => {
                const { weekday, day: dd } = dayParts(day, intlLocale);
                return (
                  <span key={day} className="flex-1 text-center text-xs font-semibold text-fg-muted">
                    {day === today ? t.showtime.today : weekday}
                    <br />
                    {dd}
                  </span>
                );
              })}
            </div>
            <table className="sr-only">
              <caption>{t.admin.dashboard.weekChart}</caption>
              <tbody>
                {days.map((day, i) => (
                  <tr key={day}>
                    <th scope="row">{day}</th>
                    <td>{counts[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <SectionHeader
          title={t.admin.dashboard.upcoming}
          actions={
            <Link href={ROUTES.admin.cinemaShowtimes(cinemaId)} className="text-sm font-bold text-accent hover:underline">
              {t.common.seeAll}
            </Link>
          }
        />
        {loading && !data ? (
          <Skeleton className="h-40 w-full" />
        ) : upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t.admin.dashboard.noUpcoming} />
        ) : (
          <Table className="min-w-0">
            <thead>
              <tr>
                <Th>{t.admin.showtimes.time}</Th>
                <Th>{t.admin.showtimes.movie}</Th>
                <Th className="text-right">{t.admin.showtimes.seats}</Th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((s: Showtime) => (
                <tr key={s.id}>
                  <Td className="whitespace-nowrap">
                    <span className="font-bold text-fg">{formatTime(s.startTime, intlLocale)}</span>{" "}
                    <span className="text-xs">{dayParts(toIsoDate(new Date(s.startTime)), intlLocale).day}/{dayParts(toIsoDate(new Date(s.startTime)), intlLocale).month}</span>
                  </Td>
                  <Td className="max-w-40 truncate">{s.movie.title}</Td>
                  <Td className="text-right whitespace-nowrap">
                    {s.availableSeats}/{s.totalSeats}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
