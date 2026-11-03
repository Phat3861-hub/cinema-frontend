"use client";

import { Info, TicketPercent } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { voucherApi } from "@/features/promotion/api";
import { OfferCard, OfferCardSkeleton } from "@/features/promotion/components/offer-card";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";

/** Public offers (PRO-01): vouchers staff marked public that can be used now, ending soonest first. */
export function OffersScreen() {
  const t = useT();
  const offers = useApi("offers:public", () => voucherApi.listPublic());

  return (
    <section className="mx-auto flex w-full max-w-[1232px] flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h6 sm:text-h4">{t.offers.title}</h1>
        <p className="text-sm font-medium text-fg-muted">{t.offers.subtitle}</p>
      </div>
      <p className="flex items-start gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-fg-2">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
        {t.offers.howTo}
      </p>

      {offers.error && !offers.data ? (
        <ErrorState error={offers.error} onRetry={offers.reload} />
      ) : !offers.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <OfferCardSkeleton key={i} />
          ))}
        </div>
      ) : offers.data.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title={t.offers.empty}
          description={t.offers.emptyHint}
          action={
            <Link href={ROUTES.movies} className={buttonClasses({ size: "md" })}>
              {t.home.browseMovies}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.data.map((offer) => (
            <OfferCard key={offer.code} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}
