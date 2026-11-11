"use client";

import { ArrowDownLeft, ArrowUpRight, Coins, RotateCcw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { LoyaltyTransaction, LoyaltyTransactionType } from "@/features/loyalty/types";
import { formatPoints } from "@/features/loyalty/rules";
import { useLocale, useT } from "@/i18n";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<LoyaltyTransactionType, typeof Coins> = {
  EARN: ArrowDownLeft,
  REDEEM: ArrowUpRight,
  RELEASE: RotateCcw,
  ADJUST: SlidersHorizontal,
};

/**
 * Point changes, newest first: what happened, the booking or the admin's reason, when, the signed points and the
 * balance after. `bookingHref` links the booking code (the customer's own tickets page); without it the code is text.
 */
export function LoyaltyHistory({
  entries,
  bookingHref,
}: {
  entries: LoyaltyTransaction[];
  bookingHref?: (bookingId: number) => string;
}) {
  const t = useT();
  const { intlLocale } = useLocale();

  return (
    <ul className="flex flex-col divide-y divide-line">
      {entries.map((entry) => {
        const Icon = ICONS[entry.type];
        const gain = entry.points > 0;
        const code = entry.booking?.bookingCode;
        return (
          <li key={entry.id} className="flex items-start gap-3 py-3">
            <span
              aria-hidden
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                gain ? "bg-success/15 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.loyalty.types[entry.type]}</p>
              {entry.booking && code && (
                <p className="text-sm font-medium text-fg-muted">
                  {bookingHref ? (
                    <Link href={bookingHref(entry.booking.id)} className="font-mono text-fg-2 underline-offset-2 hover:underline">
                      {t.loyalty.forBooking(code)}
                    </Link>
                  ) : (
                    <span className="font-mono">{t.loyalty.forBooking(code)}</span>
                  )}
                </p>
              )}
              {entry.note && <p className="text-sm font-medium break-words text-fg-2">{entry.note}</p>}
              <p className="text-xs font-medium text-fg-muted">
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt, intlLocale)}</time>
                {entry.adjustedBy && ` · ${t.loyalty.adjustedBy(entry.adjustedBy.fullName)}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`font-bold tabular-nums ${gain ? "text-success" : "text-danger"}`}>
                {gain ? "+" : "−"}
                {formatPoints(Math.abs(entry.points), intlLocale)}
              </p>
              <p className="text-xs font-medium text-fg-muted tabular-nums">
                {t.loyalty.balanceAfter(formatPoints(entry.balanceAfter, intlLocale))}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
