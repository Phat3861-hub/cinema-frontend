"use client";

import { Coins, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { controlClasses } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { Booking } from "@/features/booking/types";
import { loyaltyApi } from "@/features/loyalty/api";
import { formatPoints, maxPointsFor, pointsEarnedFor, POINT_VALUE } from "@/features/loyalty/rules";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import type { Messages } from "@/i18n/messages/vi";
import { ApiError } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";

/** Text for a refused points request, with the number the backend allows; null for any other error. */
function pointsErrorMessage(error: unknown, t: Messages, intlLocale: string): string | null {
  if (!(error instanceof ApiError)) return null;
  const details = (error.details ?? {}) as { maxPoints?: number; balance?: number };
  if (error.code === "LOYALTY_POINTS_LIMIT_EXCEEDED" && details.maxPoints != null)
    return t.loyalty.limitExceeded(formatPoints(details.maxPoints, intlLocale));
  if (error.code === "LOYALTY_POINTS_INSUFFICIENT" && details.balance != null)
    return t.loyalty.insufficient(formatPoints(details.balance, intlLocale));
  return error.code.startsWith("LOYALTY_") ? t.errors[error.code as keyof Messages["errors"]] : null;
}

/**
 * Loyalty points of a pending online booking (BOK-04): shows the balance and what this order allows (half the
 * subtotal, never more than the voucher leaves), uses the chosen number or stops using them. The points leave the
 * balance at once and come back if the booking ends unpaid. Errors other than a refused number go to `onBookingError`.
 */
export function PointsBox({
  booking,
  onChange,
  onBookingError,
  disabled = false,
}: {
  booking: Booking;
  onChange: (booking: Booking) => void;
  onBookingError: (error: unknown) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const account = useApi("loyalty:me", loyaltyApi.mine);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<Booking>, success: string) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
      setValue("");
      toast.success(success);
      account.reload();
    } catch (err) {
      const message = pointsErrorMessage(err, t, intlLocale);
      if (message) setError(message);
      else onBookingError(err);
      account.reload();
    } finally {
      setBusy(false);
    }
  }

  // Points already on the booking are out of the balance; the order may use them again
  const balance = (account.data?.balance ?? 0) + booking.pointsUsed;
  const orderMax = maxPointsFor(Number(booking.subtotal), Number(booking.voucherDiscount));
  const max = Math.min(balance, orderMax);
  const points = Number(value);
  const valid = Number.isInteger(points) && points > 0 && points <= max;

  function apply(event: FormEvent) {
    event.preventDefault();
    if (!valid) {
      setError(t.loyalty.limitExceeded(formatPoints(max, intlLocale)));
      return;
    }
    run(() => loyaltyApi.usePoints(booking.id, points), t.loyalty.applied);
  }

  const willEarn = pointsEarnedFor(Number(booking.totalAmount));

  return (
    <section className="flex flex-col gap-3" aria-labelledby="points-title">
      <h2 id="points-title" className="flex items-center gap-2 text-sm font-bold">
        <Coins aria-hidden className="size-4" />
        {t.loyalty.usePoints}
      </h2>
      {booking.pointsUsed > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-bold">{t.loyalty.points(formatPoints(booking.pointsUsed, intlLocale))}</p>
          <span className="shrink-0 font-bold text-success tabular-nums">−{formatVnd(booking.pointsDiscount, intlLocale)}</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.loyalty.remove}
            title={t.loyalty.remove}
            disabled={disabled || busy}
            onClick={() => run(() => loyaltyApi.removePoints(booking.id), t.loyalty.removed)}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
      ) : !account.data ? (
        <p className="text-xs font-medium text-fg-muted">{account.error ? t.errors.FALLBACK : t.common.loading}</p>
      ) : balance === 0 ? (
        <p className="text-sm font-medium text-fg-muted">{t.loyalty.noPoints}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-fg-muted">
            {t.loyalty.available(formatPoints(balance, intlLocale), formatVnd(balance * POINT_VALUE, intlLocale))}{" "}
            {max > 0 ? t.loyalty.maxForOrder(formatPoints(max, intlLocale)) : t.loyalty.notUsable}
          </p>
          {max > 0 && (
            <form onSubmit={apply} className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                step={1}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
                placeholder={formatPoints(max, intlLocale)}
                aria-label={t.loyalty.pointsInput}
                aria-invalid={error !== null || undefined}
                aria-describedby={error ? "points-error" : undefined}
                className={`${controlClasses({ invalid: error !== null, size: "md" })} min-w-0 flex-1 tabular-nums`}
              />
              <Button
                type="button"
                size="md"
                variant="ghost"
                className="shrink-0"
                disabled={disabled || busy}
                onClick={() => {
                  setValue(String(max));
                  setError(null);
                }}
              >
                {t.loyalty.useMax}
              </Button>
              <Button type="submit" size="md" variant="outline" className="shrink-0" loading={busy} disabled={disabled || !value}>
                {t.loyalty.apply}
              </Button>
            </form>
          )}
        </>
      )}
      {error && (
        <p id="points-error" role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      )}
      {willEarn > 0 && (
        <p className="text-xs font-semibold text-accent">{t.loyalty.willEarn(formatPoints(willEarn, intlLocale))}</p>
      )}
    </section>
  );
}
