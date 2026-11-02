"use client";

import { Building2, CalendarClock, Copy, Film, Ticket } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import type { PublicVoucher } from "@/features/promotion/types";
import { useLocale, useT } from "@/i18n";
import { formatDateTime, formatVnd } from "@/lib/format";

/** Ticket-shaped public voucher: headline discount, conditions, code with a copy button and a booking link. */
export function OfferCard({ offer }: { offer: PublicVoucher }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const headline =
    offer.discountType === "PERCENT" ? `${Number(offer.discountValue)}%` : formatVnd(offer.discountValue, intlLocale);
  const bookHref = offer.movie ? `${ROUTES.movieDetail(offer.movie.slug)}#showtimes` : ROUTES.movies;

  async function copy() {
    try {
      await navigator.clipboard.writeText(offer.code);
      toast.success(t.offers.copied(offer.code));
    } catch {
      toast.error(t.offers.copyFailed);
    }
  }

  return (
    <article className="flex overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/50">
      <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-black/20 bg-primary px-2 py-6 text-center text-black sm:w-36">
        <span className="text-xs font-bold uppercase">{t.offers.off}</span>
        {/* An amount ("1.000.000 ₫") needs a smaller size than a percent to stay on one line */}
        <span
          className={`leading-tight font-extrabold whitespace-nowrap ${
            offer.discountType === "PERCENT" ? "text-3xl" : "text-lg sm:text-xl"
          }`}
        >
          {headline}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-h8 line-clamp-2">{offer.name}</h3>
          {offer.description && <p className="line-clamp-2 text-sm font-medium text-fg-muted">{offer.description}</p>}
        </div>
        <ul className="flex flex-col gap-1 text-xs font-medium text-fg-2">
          <li>
            {Number(offer.minOrderValue) > 0
              ? t.promotion.minOrder(formatVnd(offer.minOrderValue, intlLocale))
              : t.offers.noMinimum}
            {offer.discountType === "PERCENT" && offer.maxDiscount != null && (
              <> · {t.offers.maxDiscount(formatVnd(offer.maxDiscount, intlLocale))}</>
            )}
          </li>
          <li className="flex items-center gap-1.5">
            <Building2 aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
            {offer.cinema?.name ?? t.offers.allCinemas}
          </li>
          <li className="flex items-center gap-1.5">
            <Film aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
            <span className="line-clamp-1">{offer.movie?.title ?? t.offers.allMovies}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CalendarClock aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
            {t.offers.expires(formatDateTime(offer.endAt, intlLocale))}
          </li>
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="rounded border border-dashed border-accent/60 bg-surface-2 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-fg select-all">
            {offer.code}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={t.offers.copyItem(offer.code)}
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            <Copy aria-hidden className="size-4" />
            {t.offers.copy}
          </button>
          <Link href={bookHref} className={`${buttonClasses({ size: "sm" })} ml-auto`}>
            <Ticket aria-hidden className="size-4" />
            {t.offers.book}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function OfferCardSkeleton() {
  return <Skeleton className="h-56 w-full rounded-2xl" />;
}
