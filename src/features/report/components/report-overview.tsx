"use client";

import { ArrowRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { reportApi } from "@/features/report/api";
import {
  ChangeOf,
  ChartLegend,
  PointsOf,
  RankBars,
  RevenueChart,
  SERIES,
  StatCard,
} from "@/features/report/components/report-widgets";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { addDays, formatPercent, formatVnd, todayInVietnam } from "@/lib/format";

const TOP_MOVIES = 5;

/**
 * Revenue block of the admin home (SYS-03): today and the last 7 days against the period before, the daily chart and
 * the top movies. `cinemaId` is left out for a user who sees every cinema.
 */
export function ReportOverview({ cinemaId, scope }: { cinemaId?: number; scope: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const today = todayInVietnam();
  const week = { from: addDays(today, -6), to: today, cinemaId };
  const key = `${cinemaId ?? "all"}:${today}`;
  const todaySummary = useApi(`report:today:${key}`, () => reportApi.summary({ from: today, to: today, cinemaId }));
  const weekSummary = useApi(`report:week:${key}`, () => reportApi.summary(week));
  const daily = useApi(`report:daily:${key}`, () => reportApi.daily(week));
  const movies = useApi(`report:movies:${key}`, () => reportApi.movies(week, TOP_MOVIES));

  const d = t.admin.dashboard;
  const sevenDays = weekSummary.data?.current;
  const lastWeek = weekSummary.data?.previous;
  const hasSales = daily.data?.some((day) => day.sales.bookings > 0);
  const rate = sevenDays?.occupancy.rate;

  return (
    <section aria-labelledby="report-overview-title" className="flex flex-col gap-4">
      <SectionHeader
        title={<span id="report-overview-title">{d.revenueTitle}</span>}
        description={scope}
        actions={
          <Link href={ROUTES.admin.reports} className="flex items-center gap-1 text-sm font-bold text-accent hover:underline">
            {d.viewReports}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      />

      {weekSummary.error && !weekSummary.data ? (
        <ErrorState error={weekSummary.error} onRetry={weekSummary.reload} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <li>
            <StatCard
              label={d.revenueToday}
              loading={todaySummary.loading}
              value={todaySummary.data && formatVnd(todaySummary.data.current.sales.revenue, intlLocale)}
              delta={
                todaySummary.data && (
                  <ChangeOf
                    current={todaySummary.data.current.sales.revenue}
                    previous={todaySummary.data.previous.sales.revenue}
                    against={d.yesterday}
                  />
                )
              }
            />
          </li>
          <li>
            <StatCard
              label={d.revenueWeek}
              loading={weekSummary.loading}
              value={sevenDays && formatVnd(sevenDays.sales.revenue, intlLocale)}
              delta={
                sevenDays &&
                lastWeek && <ChangeOf current={sevenDays.sales.revenue} previous={lastWeek.sales.revenue} against={d.lastWeek} />
              }
            />
          </li>
          <li>
            <StatCard
              label={d.ticketsWeek}
              loading={weekSummary.loading}
              value={sevenDays && sevenDays.sales.tickets.toLocaleString(intlLocale)}
              delta={
                sevenDays &&
                lastWeek && <ChangeOf current={sevenDays.sales.tickets} previous={lastWeek.sales.tickets} against={d.lastWeek} />
              }
            />
          </li>
          <li>
            <StatCard
              label={d.occupancyWeek}
              loading={weekSummary.loading}
              value={rate === undefined || rate === null ? undefined : formatPercent(rate, intlLocale)}
              delta={
                sevenDays &&
                lastWeek && (
                  <PointsOf current={sevenDays.occupancy.rate} previous={lastWeek.occupancy.rate} against={d.lastWeek} />
                )
              }
            />
          </li>
        </ul>
      )}

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card className="flex min-w-0 flex-col gap-5 p-6">
          <SectionHeader
            title={t.admin.reports.chartTitle}
            description={t.admin.reports.chartHint}
            actions={
              <ChartLegend
                items={[
                  { label: t.admin.reports.ticketRevenue, color: SERIES.tickets },
                  { label: t.admin.reports.productRevenue, color: SERIES.products },
                ]}
              />
            }
            as="h3"
          />
          {daily.error && !daily.data ? (
            <ErrorState error={daily.error} onRetry={daily.reload} />
          ) : !daily.data ? (
            <Skeleton className="h-64 w-full" />
          ) : hasSales ? (
            <RevenueChart days={daily.data} label={t.admin.reports.chartTitle} srTable />
          ) : (
            <EmptyState icon={BarChart3} title={t.admin.reports.empty} description={t.admin.reports.emptyHint} />
          )}
        </Card>

        <Card className="flex min-w-0 flex-col gap-5 p-6">
          <SectionHeader title={d.topMovies} description={d.lastSevenDays} as="h3" />
          {movies.error && !movies.data ? (
            <ErrorState error={movies.error} onRetry={movies.reload} />
          ) : !movies.data ? (
            <Skeleton className="h-64 w-full" />
          ) : movies.data.length === 0 ? (
            <EmptyState icon={BarChart3} title={t.admin.reports.empty} />
          ) : (
            <RankBars
              rows={movies.data.map((movie) => ({
                key: movie.movieId,
                label: movie.title,
                href: ROUTES.movieDetail(movie.slug),
                value: movie.sales.revenue,
                display: formatVnd(movie.sales.revenue, intlLocale),
              }))}
            />
          )}
        </Card>
      </div>
    </section>
  );
}
