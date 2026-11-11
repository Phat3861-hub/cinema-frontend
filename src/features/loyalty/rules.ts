/** Same rules as the backend LoyaltyService (docs §6.3), for showing what an order allows before asking it. */
export const POINT_VALUE = 1000;
export const EARN_STEP = 10000;
export const MAX_REDEEM_PERCENT = 50;

/** Most points an order may use: half the subtotal, never more than what the voucher leaves; whole points. */
export function maxPointsFor(subtotal: number, voucherDiscount: number): number {
  const cap = Math.min(Math.floor((subtotal * MAX_REDEEM_PERCENT) / 100), subtotal - voucherDiscount);
  return cap <= 0 ? 0 : Math.floor(cap / POINT_VALUE);
}

/** Points a confirmed booking of this total earns. */
export function pointsEarnedFor(total: number): number {
  return total <= 0 ? 0 : Math.floor(total / EARN_STEP);
}

export function formatPoints(points: number, intlLocale = "vi-VN"): string {
  return new Intl.NumberFormat(intlLocale).format(points);
}
