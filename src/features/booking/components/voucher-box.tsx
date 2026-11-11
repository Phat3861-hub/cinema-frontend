"use client";

import { TicketPercent, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { controlClasses } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { bookingApi } from "@/features/booking/api";
import type { Booking } from "@/features/booking/types";
import { isVoucherError, voucherErrorMessage } from "@/features/promotion/errors";
import { useLocale, useT } from "@/i18n";
import { formatVnd } from "@/lib/format";

/**
 * Voucher of a pending online booking (BOK-04): type a code to apply it (the backend recomputes the total and takes
 * one use until the booking expires unpaid), or remove the applied one. Errors other than a refused voucher – the
 * hold ended, for instance – go to `onBookingError`.
 */
export function VoucherBox({
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
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<Booking>, success: string) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
      setCode("");
      toast.success(success);
    } catch (err) {
      if (isVoucherError(err)) setError(voucherErrorMessage(err, t, intlLocale));
      else onBookingError(err);
    } finally {
      setBusy(false);
    }
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    run(() => bookingApi.applyVoucher(booking.id, code.trim()), t.promotion.applied);
  }

  const voucher = booking.voucher;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="voucher-title">
      <h2 id="voucher-title" className="flex items-center gap-2 text-sm font-bold">
        <TicketPercent aria-hidden className="size-4" />
        {t.promotion.voucher}
      </h2>
      {voucher ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold">{voucher.code}</p>
            <p className="truncate text-xs font-medium text-fg-muted">{voucher.name}</p>
          </div>
          <span className="shrink-0 font-bold text-success tabular-nums">−{formatVnd(booking.voucherDiscount, intlLocale)}</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.promotion.removeCode(voucher.code)}
            title={t.promotion.removeCode(voucher.code)}
            disabled={disabled || busy}
            onClick={() => run(() => bookingApi.removeVoucher(booking.id), t.promotion.removed)}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={apply} className="flex gap-2">
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError(null);
            }}
            placeholder={t.promotion.codePlaceholder}
            aria-label={t.promotion.voucher}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? "voucher-error" : undefined}
            maxLength={30}
            autoComplete="off"
            className={`${controlClasses({ invalid: error !== null, size: "md" })} min-w-0 flex-1 font-mono uppercase`}
          />
          <Button
            type="submit"
            size="md"
            variant="outline"
            className="shrink-0"
            loading={busy}
            disabled={disabled || !code.trim()}
          >
            {t.promotion.apply}
          </Button>
        </form>
      )}
      {error && (
        <p id="voucher-error" role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
