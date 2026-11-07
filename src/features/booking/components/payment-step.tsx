"use client";

import { CreditCard } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { VoucherBox } from "@/features/booking/components/voucher-box";
import { discountLines } from "@/features/booking/discount-lines";
import type { Booking } from "@/features/booking/types";
import { PointsBox } from "@/features/loyalty/components/points-box";
import { useLocale, useT } from "@/i18n";
import { formatTime, formatVnd } from "@/lib/format";

/**
 * Review of the held booking before paying, with its voucher and loyalty points. Online payment (VNPay) comes with the payment module,
 * so this step only shows the order and when the hold ends.
 */
export function PaymentStep({
  booking,
  onBookingChange,
  onBookingError,
  disabled = false,
}: {
  booking: Booking;
  onBookingChange: (booking: Booking) => void;
  onBookingError: (error: unknown) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const discounts = discountLines(booking, t, intlLocale);

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="payment-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="payment-title" className="text-h6">
            {t.booking.paymentTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            {t.booking.bookingCode}: <span className="font-mono font-bold text-fg">{booking.bookingCode}</span>
          </p>
        </div>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">{t.booking.summary}</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold text-fg-muted">
            <th scope="col" className="py-2 pr-3">
              {t.booking.line}
            </th>
            <th scope="col" className="py-2 pr-3 text-right">
              {t.booking.quantityShort}
            </th>
            <th scope="col" className="py-2 text-right">
              {t.booking.amount}
            </th>
          </tr>
        </thead>
        <tbody className="font-medium">
          {booking.seats.map((seat) => (
            <tr key={seat.seatId} className="border-b border-line">
              <td className="py-2.5 pr-3">
                {t.booking.seatLine(seat.seatCode)} <span className="text-fg-muted">· {t.seat.type[seat.seatType]}</span>
              </td>
              <td className="py-2.5 pr-3 text-right">1</td>
              <td className="py-2.5 text-right font-semibold">{formatVnd(seat.price, intlLocale)}</td>
            </tr>
          ))}
          {booking.items.map((item) => (
            <tr key={item.productId} className="border-b border-line">
              <td className="py-2.5 pr-3">
                {item.name} <span className="text-fg-muted">· {formatVnd(item.unitPrice, intlLocale)}</span>
              </td>
              <td className="py-2.5 pr-3 text-right">{item.quantity}</td>
              <td className="py-2.5 text-right font-semibold">{formatVnd(item.totalPrice, intlLocale)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {discounts.length > 0 && (
            <tr>
              <th scope="row" colSpan={2} className="pt-4 pr-3 text-left text-sm font-semibold text-fg-muted">
                {t.booking.subtotal}
              </th>
              <td className="pt-4 text-right font-semibold">{formatVnd(booking.subtotal, intlLocale)}</td>
            </tr>
          )}
          {discounts.map((line) => (
            <tr key={line.key}>
              <th scope="row" colSpan={2} className="pt-2 pr-3 text-left text-sm font-semibold text-success">
                {line.label}
              </th>
              <td className="pt-2 text-right font-semibold text-success">−{formatVnd(line.amount, intlLocale)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" colSpan={2} className="pt-4 pr-3 text-left text-sm font-semibold text-fg-muted">
              {t.booking.totalToPay}
            </th>
            <td className="pt-4 text-right text-xl font-bold">{formatVnd(booking.totalAmount, intlLocale)}</td>
          </tr>
        </tfoot>
      </table>

      <VoucherBox booking={booking} onChange={onBookingChange} onBookingError={onBookingError} disabled={disabled} />
      <PointsBox booking={booking} onChange={onBookingChange} onBookingError={onBookingError} disabled={disabled} />

      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm font-medium text-fg-muted">
        <CreditCard aria-hidden className="size-6 shrink-0" />
        <span>{t.booking.paymentMethodsSoon}</span>
      </div>
      {booking.expiresAt && (
        <Alert tone="info">{t.booking.paymentSoon(formatTime(booking.expiresAt, intlLocale))}</Alert>
      )}
    </section>
  );
}
