import type { Messages } from "@/i18n/messages/vi";
import { ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

/** Error text for a refused voucher; below the minimum it names the amount the order has to reach. */
export function voucherErrorMessage(error: unknown, t: Messages, intlLocale: string): string {
  if (error instanceof ApiError && error.code === "VOUCHER_MIN_ORDER_NOT_MET") {
    const details = error.details as { minOrderValue?: number } | undefined;
    if (details?.minOrderValue != null) return t.promotion.belowMinimum(formatVnd(details.minOrderValue, intlLocale));
  }
  return getErrorMessage(error, t);
}

export function isVoucherError(error: unknown): boolean {
  return error instanceof ApiError && error.code.startsWith("VOUCHER_");
}
