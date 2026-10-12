const vndFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

/** 90000 -> "90.000 ₫" */
export function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
}

/** Movie duration: 125 -> "2 giờ 5 phút" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}
