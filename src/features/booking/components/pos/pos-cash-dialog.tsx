"use client";

import { Delete } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLocale, useT } from "@/i18n";
import { formatVnd } from "@/lib/format";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;
/** Notes customers usually hand over; the quick buttons round the total up to them. */
const NOTES = [10_000, 50_000, 100_000, 200_000, 500_000];
const MAX_DIGITS = 10;

/** Exact amount + the total rounded up to common notes, smallest first (at most 4 suggestions). */
export function quickAmounts(total: number): number[] {
  const amounts = new Set<number>([total]);
  for (const note of NOTES) amounts.add(Math.ceil(total / note) * note);
  return [...amounts].sort((a, b) => a - b).slice(0, 4);
}

/**
 * Cash payment of a counter sale: amount received from a touch keypad (or the keyboard), change due computed live.
 * Mount it with a new `key` per sale so the amount starts empty.
 */
export function PosCashDialog({
  open,
  total,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  total: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (received: number) => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [digits, setDigits] = useState("");
  const received = Number(digits || "0");
  const change = received - total;
  const enough = received >= total;

  function press(key: (typeof KEYS)[number]) {
    if (key === "back") return setDigits((d) => d.slice(0, -1));
    setDigits((d) => (d === "" && key.startsWith("0") ? d : (d + key).slice(0, MAX_DIGITS)));
  }

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      size="md"
      title={t.admin.pos.cashTitle}
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button size="lg" disabled={!enough} loading={loading} onClick={() => onConfirm(received)}>
            {t.admin.pos.confirmPayment}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4 rounded-xl bg-surface-2 px-4 py-3">
          <span className="text-sm font-semibold text-fg-muted">{t.admin.pos.amountDue}</span>
          <span className="text-2xl font-bold">{formatVnd(total, intlLocale)}</span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-fg-muted">{t.admin.pos.received}</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            value={digits ? Number(digits).toLocaleString(intlLocale) : ""}
            onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS))}
            onKeyDown={(event) => event.key === "Enter" && enough && !loading && onConfirm(received)}
            placeholder="0"
            className="h-14 rounded-xl border-2 border-line-strong bg-surface px-4 text-right text-2xl font-bold tabular-nums focus:border-primary focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickAmounts(total).map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setDigits(String(amount))}
              className="h-12 cursor-pointer rounded-xl border border-line-strong px-2 text-sm font-bold transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent active:bg-primary/20"
            >
              {amount === total ? t.admin.pos.exactAmount : formatVnd(amount, intlLocale)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t.admin.pos.keypad}>
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "back" ? t.admin.pos.backspace : undefined}
              className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-surface-2 text-xl font-bold transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-accent active:bg-primary/30"
            >
              {key === "back" ? <Delete aria-hidden className="size-6" /> : key}
            </button>
          ))}
        </div>

        <div
          aria-live="polite"
          className={`flex items-baseline justify-between gap-4 rounded-xl px-4 py-3 ${enough ? "bg-success/10" : "bg-danger/10"}`}
        >
          <span className="text-sm font-semibold text-fg-muted">{enough ? t.admin.pos.change : t.admin.pos.missing}</span>
          <span className={`text-2xl font-bold ${enough ? "text-success" : "text-danger"}`}>
            {formatVnd(Math.abs(change), intlLocale)}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
