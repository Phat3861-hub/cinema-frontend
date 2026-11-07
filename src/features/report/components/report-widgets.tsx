"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import type { ReportDay } from "@/features/report/types";
import { useLocale, useT } from "@/i18n";
import { dayParts, formatCompact, formatPercent, formatVnd } from "@/lib/format";

/** Series colours follow the entity: tickets and products keep these slots on every chart. */
export const SERIES = {
  tickets: "bg-chart-1",
  products: "bg-chart-2",
};

/** Round top of a value axis, so its quarter ticks are clean numbers. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 4, 6, 8, 10].find((s) => value / magnitude <= s) ?? 10;
  return step * magnitude;
}

/** A figure of the period; `delta` is the change against the previous period. */
export function StatCard({
  label,
  value,
  delta,
  hint,
  loading,
}: {
  label: string;
  value?: string;
  delta?: ReactNode;
  hint?: string;
  loading: boolean;
}) {
  return (
    <Card className="flex h-full flex-col gap-1 p-5">
      <p className="text-sm font-semibold text-fg-muted">{label}</p>
      {loading && value === undefined ? (
        <Skeleton className="h-8 w-32" />
      ) : (
        <p className="text-2xl font-bold break-words">{value ?? "—"}</p>
      )}
      {delta}
      {hint && <p className="text-xs font-medium text-fg-subtle">{hint}</p>}
    </Card>
  );
}

function Change({ direction, children }: { direction: number; children: ReactNode }) {
  const Icon = direction > 0 ? TrendingUp : direction < 0 ? TrendingDown : Minus;
  const tone = direction > 0 ? "text-success" : direction < 0 ? "text-danger" : "text-fg-muted";
  return (
    <p className={`flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <Icon aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  );
}

/** Relative change of an amount; `against` names the baseline ("hôm qua"). */
export function ChangeOf({ current, previous, against }: { current: number; previous: number; against: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  if (previous === 0) return <p className="text-xs font-semibold text-fg-subtle">{t.admin.reports.noBaseline(against)}</p>;
  const change = (current - previous) / previous;
  const value = new Intl.NumberFormat(intlLocale, {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(change);
  return <Change direction={Math.sign(change)}>{t.admin.reports.delta(value, against)}</Change>;
}

/** Change of a rate, in percentage points. */
export function PointsOf({ current, previous, against }: { current: number | null; previous: number | null; against: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  if (current === null || previous === null) {
    return <p className="text-xs font-semibold text-fg-subtle">{t.admin.reports.noBaseline(against)}</p>;
  }
  const points = (current - previous) * 100;
  const value = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(points);
  return <Change direction={Math.sign(points)}>{t.admin.reports.deltaPoints(value, against)}</Change>;
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs font-semibold text-fg-2">
          <span aria-hidden className={`size-2.5 rounded-sm ${item.color}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function dayLabel(date: string, intlLocale: string) {
  const { day, month } = dayParts(date, intlLocale);
  return `${day}/${month}`;
}

/**
 * Stacked columns: tickets + concessions per day, before discount. Hover, tap or the arrow keys show one day; the
 * same figures are in a table (visible on the reports screen, `srTable` elsewhere).
 */
export function RevenueChart({ days, label, srTable = false }: { days: ReportDay[]; label: string; srTable?: boolean }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const top = niceCeil(Math.max(...days.map((d) => d.sales.ticketRevenue + d.sales.productRevenue)));
  const every = Math.ceil(days.length / 7);
  const current = active === null ? undefined : days[active];
  const left = active === null ? 0 : ((active + 0.5) / days.length) * 100;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") setActive(null);
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((index) => Math.min(days.length - 1, Math.max(0, (index ?? days.length) + step)));
  }

  return (
    <div className="flex gap-2">
      <div aria-hidden className="relative h-64 w-10 shrink-0 text-right text-xs font-medium text-fg-muted tabular-nums">
        {[0, 1, 2, 3, 4].map((tick) => (
          <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: `${tick * 25}%` }}>
            {formatCompact((top * tick) / 4, intlLocale)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          role="group"
          aria-label={label}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          className="relative h-64 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {[1, 2, 3, 4].map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute inset-x-0 border-t border-line"
              style={{ bottom: `${tick * 25}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-px border-b border-line-strong sm:gap-0.5">
            {days.map(({ date, sales }, index) => (
              <div
                key={date}
                onPointerEnter={() => setActive(index)}
                className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 transition-opacity ${
                  active !== null && active !== index ? "opacity-50" : ""
                }`}
              >
                {sales.productRevenue > 0 && (
                  <span
                    className={`w-full max-w-6 shrink-0 rounded-t ${SERIES.products}`}
                    style={{ height: `${(sales.productRevenue / top) * 100}%` }}
                  />
                )}
                {sales.ticketRevenue > 0 && (
                  <span
                    className={`w-full max-w-6 shrink-0 ${sales.productRevenue > 0 ? "" : "rounded-t"} ${SERIES.tickets}`}
                    style={{ height: `${(sales.ticketRevenue / top) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          {current && (
            <div
              role="status"
              className={`pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-line bg-surface p-3 shadow-lg ${
                left > 55 ? "-ml-2 -translate-x-full" : "ml-2"
              }`}
              style={{ left: `${left}%` }}
            >
              <p className="text-xs font-semibold text-fg-muted">
                {dayParts(current.date, intlLocale).weekday} {dayLabel(current.date, intlLocale)}
              </p>
              <p className="text-base font-bold text-fg">{formatVnd(current.sales.revenue, intlLocale)}</p>
              <dl className="mt-1 flex flex-col gap-0.5 text-xs">
                <TooltipRow color={SERIES.tickets} label={t.admin.reports.ticketRevenue}>
                  {formatVnd(current.sales.ticketRevenue, intlLocale)}
                </TooltipRow>
                <TooltipRow color={SERIES.products} label={t.admin.reports.productRevenue}>
                  {formatVnd(current.sales.productRevenue, intlLocale)}
                </TooltipRow>
                <TooltipRow color="bg-line-strong" label={t.admin.reports.discount}>
                  {formatVnd(current.sales.discount, intlLocale)}
                </TooltipRow>
              </dl>
            </div>
          )}
        </div>
        <div aria-hidden className="mt-1 flex h-4 gap-px sm:gap-0.5">
          {days.map(({ date }, index) => (
            <span key={date} className="relative min-w-0 flex-1">
              {index % every === 0 && (
                <span className="absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap text-fg-muted">
                  {dayLabel(date, intlLocale)}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      {srTable && (
        <table className="sr-only">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{t.admin.reports.date}</th>
              <th scope="col">{t.admin.reports.ticketRevenue}</th>
              <th scope="col">{t.admin.reports.productRevenue}</th>
              <th scope="col">{t.admin.reports.revenue}</th>
            </tr>
          </thead>
          <tbody>
            {days.map(({ date, sales }) => (
              <tr key={date}>
                <th scope="row">{dayLabel(date, intlLocale)}</th>
                <td>{formatVnd(sales.ticketRevenue, intlLocale)}</td>
                <td>{formatVnd(sales.productRevenue, intlLocale)}</td>
                <td>{formatVnd(sales.revenue, intlLocale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TooltipRow({ color, label, children }: { color: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 font-medium text-fg-muted">
        <span aria-hidden className={`h-0.5 w-3 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className="font-bold text-fg tabular-nums">{children}</dd>
    </div>
  );
}

/** Ranked rows with a thin bar, one series: the longest bar is the highest value. */
export function RankBars({
  rows,
}: {
  rows: { key: string | number; label: string; href?: string; value: number; display: string; hint?: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ol className="flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {row.href ? (
              <Link href={row.href} className="min-w-0 truncate font-semibold text-fg hover:underline">
                {row.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate font-semibold text-fg">{row.label}</span>
            )}
            <span className="shrink-0 font-bold text-fg tabular-nums">{row.display}</span>
          </div>
          {row.value > 0 && (
            <span
              aria-hidden
              className={`block h-2 rounded-full ${SERIES.tickets}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          )}
          {row.hint && <span className="text-xs font-medium text-fg-subtle">{row.hint}</span>}
        </li>
      ))}
    </ol>
  );
}

/** One whole split into parts; the shares are in the table next to it. */
export function ShareBar({
  parts,
  label,
}: {
  parts: { key: string; label: string; value: number; color: string }[];
  label: string;
}) {
  const { intlLocale } = useLocale();
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const share = (value: number) => formatPercent(total ? value / total : 0, intlLocale);
  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`${label}: ${parts.map((part) => `${part.label} ${share(part.value)}`).join(", ")}`}
        className="flex h-2 gap-0.5 overflow-hidden rounded-full"
      >
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              title={`${part.label}: ${share(part.value)}`}
              className={part.color}
              style={{ width: `${(part.value / Math.max(total, 1)) * 100}%` }}
            />
          ))}
      </div>
      <ChartLegend items={parts} />
    </div>
  );
}
