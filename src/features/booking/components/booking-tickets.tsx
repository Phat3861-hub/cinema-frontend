"use client";

import { ArrowLeft, Printer, Ticket } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { PrintPortal } from "@/components/ui/print-portal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { bookingApi } from "@/features/booking/api";
import { BOOKING_STATUS_TONES } from "@/features/booking/components/my-bookings";
import { PrintableTickets, TicketCard } from "@/features/booking/components/ticket-card";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";

/** `/my-tickets/[bookingId]`: the booking with one QR e-ticket per seat, printable. */
export function BookingTickets({ bookingId }: { bookingId: number }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const booking = useApi(`booking:${bookingId}`, () => bookingApi.get(bookingId));

  const back = (
    <Link href={ROUTES.myTickets} className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg">
      <ArrowLeft aria-hidden className="size-4" />
      {t.nav.myTickets}
    </Link>
  );

  if (booking.error && !booking.data) {
    const missing = booking.error instanceof ApiError && booking.error.code === "BOOKING_NOT_FOUND";
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        {back}
        {missing ? (
          <EmptyState icon={Ticket} title={t.account.tickets.notFound} />
        ) : (
          <ErrorState error={booking.error} onRetry={booking.reload} />
        )}
      </section>
    );
  }
  if (!booking.data) return <Skeleton className="h-96 rounded-2xl" />;

  const data = booking.data;
  const showtime = data.showtime;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="booking-title">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="booking-title" className="text-h6 break-words">
            {showtime?.movie.title ?? t.account.tickets.showtimeGone}
          </h1>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            {t.booking.bookingCode}: <span className="font-mono font-bold text-fg-2">{data.bookingCode}</span>
            {showtime && ` · ${formatDateTime(showtime.startTime, intlLocale)} · ${showtime.cinema.name} · ${showtime.room.name}`}
          </p>
        </div>
        <Badge tone={BOOKING_STATUS_TONES[data.status]}>{t.booking.status[data.status]}</Badge>
      </div>

      {data.tickets.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-fg-muted">{t.account.tickets.showAtGate}</p>
            <Button variant="outline" size="md" onClick={() => window.print()}>
              <Printer aria-hidden className="size-4" />
              {t.booking.ticket.print}
            </Button>
          </div>
          <ul className="flex flex-col gap-3">
            {data.tickets.map((ticket) => (
              <TicketCard key={ticket.id} booking={data} ticket={ticket} />
            ))}
          </ul>
          <PrintPortal>
            <PrintableTickets booking={data} />
          </PrintPortal>
        </>
      ) : (
        <Alert tone="info">{t.account.tickets.noTickets}</Alert>
      )}

      {data.items.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-4 text-sm">
          <h2 className="text-sm font-bold tracking-wide text-fg-muted uppercase">{t.booking.snacks}</h2>
          {data.items.map((item) => (
            <p key={item.productId} className="flex justify-between gap-4 font-medium text-fg-2">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatVnd(item.totalPrice, intlLocale)}</span>
            </p>
          ))}
          <p className="text-xs text-fg-muted">{t.account.tickets.snacksAtCounter}</p>
        </div>
      )}

      {Number(data.discountAmount) > 0 && (
        <p className="flex justify-between gap-4 text-sm font-medium text-success">
          <span>{data.voucher ? t.promotion.discountLine(data.voucher.code) : t.booking.discount}</span>
          <span>−{formatVnd(data.discountAmount, intlLocale)}</span>
        </p>
      )}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-semibold text-fg-muted">{t.booking.totalToPay}</span>
        <span className="text-xl font-bold">{formatVnd(data.totalAmount, intlLocale)}</span>
      </div>
      <Link href={ROUTES.myTickets} className={buttonClasses({ variant: "ghost", size: "md" })}>
        {t.account.tickets.backToList}
      </Link>
    </section>
  );
}
