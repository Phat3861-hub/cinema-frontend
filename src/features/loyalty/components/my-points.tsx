"use client";

import { Coins, History } from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { loyaltyApi } from "@/features/loyalty/api";
import { LoyaltyHistory } from "@/features/loyalty/components/loyalty-history";
import { formatPoints } from "@/features/loyalty/rules";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { formatVnd } from "@/lib/format";

const PAGE_SIZE = 10;

/** `/points` (PRO-02): the signed-in user's balance, how points work, and every change, newest first. */
export function MyPoints() {
  const t = useT();
  const { intlLocale } = useLocale();
  const [page, setPage] = useState(0);
  const account = useApi("loyalty:me", loyaltyApi.mine);
  const history = useApi(`loyalty:me:history:${page}`, () => loyaltyApi.myHistory({ page, size: PAGE_SIZE }));
  const data = history.data;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6" aria-labelledby="points-title">
        <h1 id="points-title" className="text-h6">
          {t.loyalty.title}
        </h1>
        {account.error !== undefined && !account.data ? (
          <ErrorState error={account.error} onRetry={account.reload} />
        ) : (
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="flex items-center gap-4 rounded-xl bg-primary/15 p-5">
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-black">
                <Coins className="size-7" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg-muted">{t.loyalty.balance}</p>
                {account.data ? (
                  <>
                    <p className="text-3xl font-bold tabular-nums">{formatPoints(account.data.balance, intlLocale)}</p>
                    <p className="text-sm font-medium text-fg-2">
                      {t.loyalty.worth(formatVnd(account.data.balance * account.data.pointValue, intlLocale))}
                    </p>
                  </>
                ) : (
                  <Skeleton className="mt-1 h-9 w-24" />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-bold">{t.loyalty.rules}</h2>
              {account.data && (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm font-medium text-fg-2">
                  <li>{t.loyalty.ruleEarn(formatVnd(account.data.earnStep, intlLocale))}</li>
                  <li>{t.loyalty.ruleUse(formatVnd(account.data.pointValue, intlLocale), account.data.maxRedeemPercent)}</li>
                  <li>{t.loyalty.ruleKeep}</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
        aria-labelledby="points-history-title"
      >
        <h2 id="points-history-title" className="text-h8 flex items-center gap-2">
          <History aria-hidden className="size-5" />
          {t.loyalty.history}
        </h2>
        {history.error !== undefined && !data ? (
          <ErrorState error={history.error} onRetry={history.reload} />
        ) : !data ? (
          <LoadingState />
        ) : data.content.length === 0 ? (
          <EmptyState icon={Coins} title={t.loyalty.empty} description={t.loyalty.emptyHint} />
        ) : (
          <div className={`transition-opacity ${history.loading ? "opacity-60" : ""}`}>
            <LoyaltyHistory entries={data.content} bookingHref={ROUTES.myTicket} />
          </div>
        )}
        {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
      </section>
    </div>
  );
}
