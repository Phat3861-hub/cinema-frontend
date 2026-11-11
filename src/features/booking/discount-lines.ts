import type { Booking } from "@/features/booking/types";
import { formatPoints } from "@/features/loyalty/rules";
import type { Messages } from "@/i18n/messages/vi";

export interface DiscountLine {
  key: "voucher" | "points";
  label: string;
  amount: number;
}

/** What came off a booking, one line per source: its voucher, then its loyalty points. */
export function discountLines(booking: Booking, t: Messages, intlLocale: string): DiscountLine[] {
  const lines: DiscountLine[] = [];
  const voucher = Number(booking.voucherDiscount);
  if (voucher > 0) {
    lines.push({
      key: "voucher",
      label: booking.voucher ? t.promotion.discountLine(booking.voucher.code) : t.booking.discount,
      amount: voucher,
    });
  }
  const points = Number(booking.pointsDiscount);
  if (points > 0) {
    lines.push({ key: "points", label: t.loyalty.usedLine(formatPoints(booking.pointsUsed, intlLocale)), amount: points });
  }
  return lines;
}
