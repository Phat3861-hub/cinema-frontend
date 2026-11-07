"use client";

import { CircleCheck, Plus, Printer } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PrintPortal } from "@/components/ui/print-portal";
import { PrintableTickets, TicketCard } from "@/features/booking/components/ticket-card";
import type { Booking } from "@/features/booking/types";
import { discountLines } from "@/features/booking/discount-lines";
import { formatPoints } from "@/features/loyalty/rules";
import { useLocale, useT } from "@/i18n";
import { formatVnd } from "@/lib/format";

/**
 * After a counter sale: change due, booking code and the tickets, with print and "next customer" as the two big
 * actions. Focus starts on "Print" so the cashier can press Enter.
 */
export function PosReceipt({ booking, received, onNext }: { booking: Booking; received: number; onNext: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const printButton = useRef<HTMLButtonElement>(null);
  const change = received - Number(booking.totalAmount);

  useEffect(() => {
    printButton.current?.focus();
  }, []);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="pos-done-title">
      <div className="flex flex-wrap items-center gap-4">
        <CircleCheck aria-hidden className="size-12 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <h2 id="pos-done-title" className="text-h6">
            {t.admin.pos.soldTitle}
          </h2>
          <p className="text-sm font-medium text-fg-muted">
            {t.booking.bookingCode}: <span className="font-mono text-base font-bold text-fg">{booking.bookingCode}</span>
            {booking.customer?.userId != null && ` · ${t.admin.pos.linkedToAccount}`}
          </p>
          {discountLines(booking, t, intlLocale).map((line) => (
            <p key={line.key} className="text-sm font-semibold text-success">
              {line.label}: −{formatVnd(line.amount, intlLocale)}
            </p>
          ))}
          {booking.pointsEarned > 0 && (
            <p className="text-sm font-semibold text-accent">{t.loyalty.earnLine(formatPoints(booking.pointsEarned, intlLocale))}</p>
          )}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Amount label={t.booking.totalToPay} value={formatVnd(booking.totalAmount, intlLocale)} />
        <Amount label={t.admin.pos.received} value={formatVnd(received, intlLocale)} />
        <Amount label={t.admin.pos.change} value={formatVnd(change, intlLocale)} highlight />
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button ref={printButton} size="lg" className="h-16 text-lg" onClick={() => window.print()}>
          <Printer aria-hidden className="size-6" />
          {t.admin.pos.printTickets(booking.tickets.length)}
        </Button>
        <Button variant="outline" size="lg" className="h-16 text-lg" onClick={onNext}>
          <Plus aria-hidden className="size-6" />
          {t.admin.pos.nextCustomer}
        </Button>
      </div>

      <ul className="grid gap-3 xl:grid-cols-2">
        {booking.tickets.map((ticket) => (
          <TicketCard key={ticket.id} booking={booking} ticket={ticket} />
        ))}
      </ul>

      <PrintPortal>
        <PrintableTickets booking={booking} />
      </PrintPortal>
    </section>
  );
}

function Amount({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-success/10" : "bg-surface-2"}`}>
      <dt className="text-xs font-semibold text-fg-muted">{label}</dt>
      <dd className={`text-2xl font-bold tabular-nums ${highlight ? "text-success" : ""}`}>{value}</dd>
    </div>
  );
}
