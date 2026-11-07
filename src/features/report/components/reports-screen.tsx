"use client";

import { BarChart3, Building2, Download } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { controlClasses } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { reportApi } from "@/features/report/api";
import {
  ChangeOf,
  ChartLegend,
  PointsOf,
  RevenueChart,
  SERIES,
  ShareBar,
  StatCard,
} from "@/features/report/components/report-widgets";
import { downloadCsv } from "@/features/report/csv";
import type { ReportChannel, ReportFilter, ReportOccupancy, ReportSales, ReportSummary } from "@/features/report/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { addDays, formatDate, formatPercent, formatVnd, todayInVietnam } from "@/lib/format";

const MAX_RANGE_DAYS = 92;
const MOVIE_LIMIT = 50;

const PRESETS = ["today", "last7", "last30", "month", "custom"] as const;
type Preset = (typeof PRESETS)[number];
type Tab = "overview" | "movies" | "cinemas" | "products" | "channels";

const CATEGORY_COLORS: Record<string, string> = {
  POPCORN: "bg-chart-1",
  DRINK: "bg-chart-2",
  SNACK: "bg-chart-3",
  COMBO: "bg-chart-4",
};

const CHANNEL_COLORS: Record<ReportChannel, string> = { ONLINE: "bg-chart-1", COUNTER: "bg-chart-2" };

function presetRange(preset: Exclude<Preset, "custom">, today: string) {
  const from = {
    today,
    last7: addDays(today, -6),
    last30: addDays(today, -29),
    month: `${today.slice(0, 8)}01`,
  }[preset];
  return { from, to: today };
}

function rate(occupancy: ReportOccupancy, intlLocale: string) {
  return occupancy.rate === null ? "—" : formatPercent(occupancy.rate, intlLocale);
}

/**
 * Reports (SYS-03): one period and cinema scope every figure below; sales count on the sale day, occupancy on the show
 * day. A user without REPORT_VIEW_ALL only picks among their own cinemas. Each tab exports what it shows as CSV.
 */
export function ReportsScreen() {
  const t = useT();
  const { user } = useSession();
  const { cinemas, selected, loading: cinemasLoading } = useAdminCinema();
  const today = todayInVietnam();
  const [preset, setPreset] = useState<Preset>("last7");
  const [custom, setCustom] = useState(() => presetRange("last7", today));
  const [pickedCinema, setPickedCinema] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const r = t.admin.reports;
  const canAll = hasAny(user, ["REPORT_VIEW_ALL"]);
  const cinemaId = pickedCinema ? Number(pickedCinema) : canAll ? undefined : selected?.id;
  const period = preset === "custom" ? custom : presetRange(preset, today);
  const filter: ReportFilter = { ...period, cinemaId };
  const key = `${period.from}:${period.to}:${cinemaId ?? "all"}`;
  const ready = canAll || cinemaId !== undefined;
  const summary = useApi(ready ? `report:summary:${key}` : null, () => reportApi.summary(filter));

  // The per-cinema tab only makes sense across every cinema
  const shownTab = tab === "cinemas" && (!canAll || cinemaId !== undefined) ? "overview" : tab;
  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: r.tab.overview },
    { value: "movies", label: r.tab.movies },
    ...(canAll && cinemaId === undefined ? [{ value: "cinemas" as const, label: r.tab.cinemas }] : []),
    { value: "products", label: r.tab.products },
    { value: "channels", label: r.tab.channels },
  ];

  if (!ready && !cinemasLoading) {
    return <EmptyState icon={Building2} title={t.admin.noCinema} description={t.admin.noCinemaHint} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-fg-muted">{r.subtitle}</p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-full overflow-x-auto">
          <Segmented
            label={r.period}
            value={preset}
            onChange={setPreset}
            items={PRESETS.map((value) => ({ value, label: r.preset[value] }))}
          />
        </div>
        {preset === "custom" && (
          <>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {r.from}
              <input
                type="date"
                value={custom.from}
                max={today}
                onChange={(e) => {
                  const from = e.target.value;
                  if (!from) return;
                  const latest = addDays(from, MAX_RANGE_DAYS - 1);
                  setCustom((c) => ({ from, to: c.to < from || c.to > latest ? (latest < today ? latest : today) : c.to }));
                }}
                className={controlClasses({ size: "md" })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {r.to}
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                max={addDays(custom.from, MAX_RANGE_DAYS - 1) < today ? addDays(custom.from, MAX_RANGE_DAYS - 1) : today}
                onChange={(e) => {
                  const to = e.target.value;
                  if (to) setCustom((c) => ({ ...c, to }));
                }}
                className={controlClasses({ size: "md" })}
              />
            </label>
          </>
        )}
        {(canAll || cinemas.length > 1) && (
          <div className="w-full sm:w-64">
            <SelectField
              label={r.cinema}
              size="md"
              value={pickedCinema || (canAll ? "" : String(cinemaId ?? ""))}
              onChange={(e) => setPickedCinema(e.target.value)}
            >
              {canAll && <option value="">{r.allCinemas}</option>}
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-6 transition-opacity ${summary.loading ? "opacity-60" : ""}`}>
        {summary.error && !summary.data ? (
          <ErrorState error={summary.error} onRetry={summary.reload} />
        ) : (
          <SummaryTiles summary={summary.data} loading={summary.loading} />
        )}

        <div className="flex flex-col gap-1">
          <Tabs label={r.tabsLabel} items={tabs} value={shownTab} onChange={setTab} />
          <p className="pt-3 text-xs font-medium text-fg-subtle">{r.basis}</p>
        </div>

        {ready && shownTab === "overview" && <OverviewPanel filter={filter} queryKey={key} />}
        {ready && shownTab === "movies" && <MoviesPanel filter={filter} queryKey={key} />}
        {ready && shownTab === "cinemas" && <CinemasPanel filter={filter} queryKey={key} />}
        {ready && shownTab === "products" && <ProductsPanel filter={filter} queryKey={key} />}
        {ready && shownTab === "channels" && <ChannelsPanel summary={summary.data} filter={filter} />}
      </div>
    </div>
  );
}

function SummaryTiles({ summary, loading }: { summary?: ReportSummary; loading: boolean }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;
  const current = summary?.current;
  const previous = summary?.previous;
  const tickets = current?.averageTicketPrice ?? null;
  const occupancy = current?.occupancy;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <li>
        <StatCard
          label={r.revenue}
          loading={loading}
          value={current && formatVnd(current.sales.revenue, intlLocale)}
          delta={
            current &&
            previous && <ChangeOf current={current.sales.revenue} previous={previous.sales.revenue} against={r.previousPeriod} />
          }
          hint={current && r.discountHint(formatVnd(current.sales.discount, intlLocale))}
        />
      </li>
      <li>
        <StatCard
          label={r.ticketsSold}
          loading={loading}
          value={current?.sales.tickets.toLocaleString(intlLocale)}
          delta={
            current &&
            previous && <ChangeOf current={current.sales.tickets} previous={previous.sales.tickets} against={r.previousPeriod} />
          }
          hint={tickets === null ? undefined : r.averageTicket(formatVnd(tickets, intlLocale))}
        />
      </li>
      <li>
        <StatCard
          label={r.productRevenue}
          loading={loading}
          value={current && formatVnd(current.sales.productRevenue, intlLocale)}
          delta={
            current &&
            previous && (
              <ChangeOf
                current={current.sales.productRevenue}
                previous={previous.sales.productRevenue}
                against={r.previousPeriod}
              />
            )
          }
        />
      </li>
      <li>
        <StatCard
          label={r.occupancy}
          loading={loading}
          value={occupancy?.rate === null || !occupancy ? undefined : formatPercent(occupancy.rate, intlLocale)}
          delta={
            current &&
            previous && (
              <PointsOf current={current.occupancy.rate} previous={previous.occupancy.rate} against={r.previousPeriod} />
            )
          }
          hint={
            occupancy &&
            r.seats(occupancy.soldSeats.toLocaleString(intlLocale), occupancy.sellableSeats.toLocaleString(intlLocale))
          }
        />
      </li>
    </ul>
  );
}

function PanelCard({
  title,
  description,
  onExport,
  children,
}: {
  title: string;
  description?: string;
  onExport?: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <Card className="flex min-w-0 flex-col gap-5 p-6">
      <SectionHeader
        title={title}
        description={description}
        as="h2"
        actions={
          onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download aria-hidden className="size-4" />
              {t.admin.reports.exportCsv}
            </Button>
          )
        }
      />
      {children}
    </Card>
  );
}

const hasSales = (sales: ReportSales[]) => sales.some((s) => s.bookings > 0);

function filename(name: string, filter: ReportFilter) {
  return `${name}_${filter.from}_${filter.to}.csv`;
}

function OverviewPanel({ filter, queryKey }: { filter: ReportFilter; queryKey: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;
  const { data, error, reload } = useApi(`report:daily:${queryKey}`, () => reportApi.daily(filter));

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96 w-full" />;
  if (!hasSales(data.map((day) => day.sales))) {
    return <EmptyState icon={BarChart3} title={r.empty} description={r.emptyHint} />;
  }

  const newestFirst = [...data].reverse();
  const header = [r.date, r.bookings, r.tickets, r.ticketRevenue, r.productRevenue, r.discount, r.revenue];
  const total = data.reduce(
    (sum, { sales }) => ({
      bookings: sum.bookings + sales.bookings,
      tickets: sum.tickets + sales.tickets,
      ticketRevenue: sum.ticketRevenue + sales.ticketRevenue,
      productRevenue: sum.productRevenue + sales.productRevenue,
      discount: sum.discount + sales.discount,
      revenue: sum.revenue + sales.revenue,
    }),
    { bookings: 0, tickets: 0, ticketRevenue: 0, productRevenue: 0, discount: 0, revenue: 0 },
  );
  const money = (value: number) => formatVnd(value, intlLocale);

  return (
    <>
      <PanelCard title={r.chartTitle} description={r.chartHint}>
        <ChartLegend
          items={[
            { label: r.ticketRevenue, color: SERIES.tickets },
            { label: r.productRevenue, color: SERIES.products },
          ]}
        />
        <RevenueChart days={data} label={r.chartTitle} />
      </PanelCard>
      <PanelCard
        title={r.dailyTable}
        onExport={() =>
          downloadCsv(
            filename("doanh-thu-theo-ngay", filter),
            header,
            newestFirst.map(({ date, sales }) => [
              date,
              sales.bookings,
              sales.tickets,
              sales.ticketRevenue,
              sales.productRevenue,
              sales.discount,
              sales.revenue,
            ]),
          )
        }
      >
        <Table>
          <thead>
            <tr>
              {header.map((label, index) => (
                <Th key={index} className={index ? "text-right" : ""}>
                  {label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {newestFirst.map(({ date, sales }) => (
              <tr key={date}>
                <Td className="whitespace-nowrap">{formatDate(date, intlLocale)}</Td>
                <Num>{sales.bookings}</Num>
                <Num>{sales.tickets}</Num>
                <Num>{money(sales.ticketRevenue)}</Num>
                <Num>{money(sales.productRevenue)}</Num>
                <Num>{money(sales.discount)}</Num>
                <Num strong>{money(sales.revenue)}</Num>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <Td className="font-bold text-fg">{r.total}</Td>
              <Num strong>{total.bookings}</Num>
              <Num strong>{total.tickets}</Num>
              <Num strong>{money(total.ticketRevenue)}</Num>
              <Num strong>{money(total.productRevenue)}</Num>
              <Num strong>{money(total.discount)}</Num>
              <Num strong>{money(total.revenue)}</Num>
            </tr>
          </tfoot>
        </Table>
      </PanelCard>
    </>
  );
}

function Num({ strong = false, children }: { strong?: boolean; children: ReactNode }) {
  const { intlLocale } = useLocale();
  return (
    <Td className={`text-right whitespace-nowrap tabular-nums ${strong ? "font-bold text-fg" : ""}`}>
      {typeof children === "number" ? children.toLocaleString(intlLocale) : children}
    </Td>
  );
}

function MoviesPanel({ filter, queryKey }: { filter: ReportFilter; queryKey: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;
  const { data, error, reload } = useApi(`report:movies:${queryKey}`, () => reportApi.movies(filter, MOVIE_LIMIT));
  const header = [r.movie, r.revenue, r.tickets, r.showtimes, r.occupancy];

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  return (
    <PanelCard
      title={r.tab.movies}
      description={r.moviesHint}
      onExport={
        data &&
        (() =>
          downloadCsv(
            filename("phim", filter),
            header,
            data.map((m) => [m.title, m.sales.revenue, m.sales.tickets, m.occupancy.showtimes, rate(m.occupancy, "en-GB")]),
          ))
      }
    >
      <Table>
        <thead>
          <tr>
            {header.map((label, index) => (
              <Th key={index} className={index ? "text-right" : ""}>
                {label}
              </Th>
            ))}
          </tr>
        </thead>
        {!data ? (
          <TableSkeleton columns={header.length} />
        ) : (
          <tbody>
            {data.map((movie) => (
              <tr key={movie.movieId}>
                <Td className="max-w-72 truncate">
                  <Link href={ROUTES.movieDetail(movie.slug)} className="font-semibold text-fg hover:underline">
                    {movie.title}
                  </Link>
                </Td>
                <Num strong>{formatVnd(movie.sales.revenue, intlLocale)}</Num>
                <Num>{movie.sales.tickets}</Num>
                <Num>{movie.occupancy.showtimes}</Num>
                <Num>{rate(movie.occupancy, intlLocale)}</Num>
              </tr>
            ))}
          </tbody>
        )}
      </Table>
      {data?.length === 0 && <EmptyState icon={BarChart3} title={r.empty} description={r.emptyHint} />}
    </PanelCard>
  );
}

function CinemasPanel({ filter, queryKey }: { filter: ReportFilter; queryKey: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;
  const { data, error, reload } = useApi(`report:cinemas:${queryKey}`, () =>
    reportApi.cinemas({ from: filter.from, to: filter.to }),
  );
  const header = [r.cinema, r.city, r.revenue, r.tickets, r.showtimes, r.occupancy];

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  return (
    <PanelCard
      title={r.tab.cinemas}
      onExport={
        data &&
        (() =>
          downloadCsv(
            filename("rap", filter),
            header,
            data.map((c) => [
              c.name,
              c.city,
              c.sales.revenue,
              c.sales.tickets,
              c.occupancy.showtimes,
              rate(c.occupancy, "en-GB"),
            ]),
          ))
      }
    >
      <Table>
        <thead>
          <tr>
            {header.map((label, index) => (
              <Th key={index} className={index > 1 ? "text-right" : ""}>
                {label}
              </Th>
            ))}
          </tr>
        </thead>
        {!data ? (
          <TableSkeleton columns={header.length} />
        ) : (
          <tbody>
            {data.map((cinema) => (
              <tr key={cinema.cinemaId}>
                <Td className="font-semibold text-fg">{cinema.name}</Td>
                <Td>{cinema.city}</Td>
                <Num strong>{formatVnd(cinema.sales.revenue, intlLocale)}</Num>
                <Num>{cinema.sales.tickets}</Num>
                <Num>{cinema.occupancy.showtimes}</Num>
                <Num>{rate(cinema.occupancy, intlLocale)}</Num>
              </tr>
            ))}
          </tbody>
        )}
      </Table>
      {data?.length === 0 && <EmptyState icon={BarChart3} title={r.empty} description={r.emptyHint} />}
    </PanelCard>
  );
}

function ProductsPanel({ filter, queryKey }: { filter: ReportFilter; queryKey: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;
  const { data, error, reload } = useApi(`report:products:${queryKey}`, () => reportApi.products(filter));

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96 w-full" />;
  if (data.products.length === 0) return <EmptyState icon={BarChart3} title={r.empty} description={r.emptyHint} />;

  const categoryName = (category: string) => t.booking.category[category as keyof typeof t.booking.category] ?? category;
  const total = data.categories.reduce((sum, category) => sum + category.revenue, 0);
  const header = [r.product, r.category, r.quantity, r.revenue];

  return (
    <>
      <PanelCard title={r.byCategory}>
        <ShareBar
          label={r.byCategory}
          parts={data.categories.map((category) => ({
            key: category.category,
            label: categoryName(category.category),
            value: category.revenue,
            color: CATEGORY_COLORS[category.category] ?? "bg-line-strong",
          }))}
        />
        <Table className="min-w-0">
          <thead>
            <tr>
              <Th>{r.category}</Th>
              <Th className="text-right">{r.quantity}</Th>
              <Th className="text-right">{r.revenue}</Th>
              <Th className="text-right">{r.share}</Th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.category}>
                <Td className="font-semibold text-fg">{categoryName(category.category)}</Td>
                <Num>{category.quantity}</Num>
                <Num strong>{formatVnd(category.revenue, intlLocale)}</Num>
                <Num>{formatPercent(total ? category.revenue / total : 0, intlLocale)}</Num>
              </tr>
            ))}
          </tbody>
        </Table>
      </PanelCard>
      <PanelCard
        title={r.byProduct}
        onExport={() =>
          downloadCsv(
            filename("bap-nuoc", filter),
            header,
            data.products.map((p) => [p.name, categoryName(p.category), p.quantity, p.revenue]),
          )
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>{r.product}</Th>
              <Th>{r.category}</Th>
              <Th className="text-right">{r.quantity}</Th>
              <Th className="text-right">{r.revenue}</Th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr key={product.productId}>
                <Td className="font-semibold text-fg">{product.name}</Td>
                <Td>{categoryName(product.category)}</Td>
                <Num>{product.quantity}</Num>
                <Num strong>{formatVnd(product.revenue, intlLocale)}</Num>
              </tr>
            ))}
          </tbody>
        </Table>
      </PanelCard>
    </>
  );
}

function ChannelsPanel({ summary, filter }: { summary?: ReportSummary; filter: ReportFilter }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const r = t.admin.reports;

  if (!summary) return <Skeleton className="h-64 w-full" />;
  const { channels, sales } = summary.current;
  if (sales.bookings === 0) return <EmptyState icon={BarChart3} title={r.empty} description={r.emptyHint} />;

  const header = [r.channel, r.bookings, r.tickets, r.ticketRevenue, r.productRevenue, r.discount, r.revenue, r.share];
  const money = (value: number) => formatVnd(value, intlLocale);
  const share = (value: number) => (sales.revenue ? value / sales.revenue : 0);

  return (
    <PanelCard
      title={r.tab.channels}
      onExport={() =>
        downloadCsv(
          filename("kenh-ban", filter),
          header,
          channels.map(({ channel, sales: s }) => [
            t.booking.channel[channel],
            s.bookings,
            s.tickets,
            s.ticketRevenue,
            s.productRevenue,
            s.discount,
            s.revenue,
            formatPercent(share(s.revenue), "en-GB"),
          ]),
        )
      }
    >
      <ShareBar
        label={r.tab.channels}
        parts={channels.map(({ channel, sales: s }) => ({
          key: channel,
          label: t.booking.channel[channel],
          value: s.revenue,
          color: CHANNEL_COLORS[channel],
        }))}
      />
      <Table>
        <thead>
          <tr>
            {header.map((label, index) => (
              <Th key={index} className={index ? "text-right" : ""}>
                {label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map(({ channel, sales: s }) => (
            <tr key={channel}>
              <Td className="font-semibold text-fg">{t.booking.channel[channel]}</Td>
              <Num>{s.bookings}</Num>
              <Num>{s.tickets}</Num>
              <Num>{money(s.ticketRevenue)}</Num>
              <Num>{money(s.productRevenue)}</Num>
              <Num>{money(s.discount)}</Num>
              <Num strong>{money(s.revenue)}</Num>
              <Num>{formatPercent(share(s.revenue), intlLocale)}</Num>
            </tr>
          ))}
        </tbody>
      </Table>
    </PanelCard>
  );
}
