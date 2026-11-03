import type { DiscountType } from "@/features/promotion/types";
import type { Messages } from "@/i18n/messages/vi";
import { formatVnd } from "@/lib/format";

interface Terms {
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
}

/**
 * Same rule as the backend (VoucherRedemptionService.discountOf): a percent of the subtotal rounded down to the đồng,
 * capped by `maxDiscount`, or the fixed amount; never more than the subtotal. Null below `minOrderValue`.
 */
export function discountOf(terms: Terms, subtotal: number): number | null {
  if (subtotal < Number(terms.minOrderValue ?? 0)) return null;
  let discount =
    terms.discountType === "PERCENT" ? Math.floor((subtotal * Number(terms.discountValue)) / 100) : Number(terms.discountValue);
  if (terms.maxDiscount != null) discount = Math.min(discount, Number(terms.maxDiscount));
  return Math.min(discount, subtotal);
}

/** "20% (tối đa 50.000 ₫)" / "50.000 ₫". */
export function describeDiscount(terms: Terms, t: Messages, intlLocale: string): string {
  if (terms.discountType === "FIXED") return formatVnd(terms.discountValue, intlLocale);
  const percent = `${Number(terms.discountValue)}%`;
  return terms.maxDiscount != null ? t.promotion.percentCapped(percent, formatVnd(terms.maxDiscount, intlLocale)) : percent;
}
