"use client";

import { QRCodeSVG } from "qrcode.react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Booking, BookingTicket, TicketStatus } from "@/features/booking/types";
import { useLocale, useT } from "@/i18n";
import { formatDateTime, formatVnd } from "@/lib/format";

export const TICKET_TONES: Record<TicketStatus, BadgeTone> = {
  VALID: "success",
  USED: "info",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

/** One e-ticket: showtime, seat and the QR code scanned at check-in (faded once the ticket is no longer valid). */
export function TicketCard({ booking, ticket }: { booking: Booking; ticket: BookingTicket }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const showtime = booking.showtime;
  const valid = ticket.status === "VALID";

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface-2 sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-h8 min-w-0 break-words">{showtime?.movie.title ?? t.account.tickets.showtimeGone}</p>
          <Badge tone={TICKET_TONES[ticket.status]}>{t.booking.ticket.status[ticket.status]}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {showtime && (
            <>
              <TicketField label={t.booking.time} value={formatDateTime(showtime.startTime, intlLocale)} />
              <TicketField label={t.booking.cinema} value={`${showtime.cinema.name} · ${showtime.room.name}`} />
            </>
          )}
          <TicketField label={t.booking.ticket.seat} value={ticket.seatCode} strong />
          <TicketField label={t.booking.ticket.price} value={formatVnd(ticket.price, intlLocale)} />
        </dl>
        <p className="text-xs font-medium text-fg-muted">
          {t.booking.ticket.code}: <span className="font-mono font-bold text-fg-2">{ticket.ticketCode}</span>
        </p>
      </div>
      <div className="flex items-center justify-center border-t border-dashed border-line-strong p-4 sm:border-t-0 sm:border-l">
        {/* QR codes need a light quiet zone to scan, whatever the theme. */}
        <div className={`rounded-lg bg-white p-2 ${valid ? "" : "opacity-30"}`}>
          <QRCodeSVG value={ticket.qrToken} size={128} level="M" title={t.booking.ticket.qrAlt(ticket.seatCode)} />
        </div>
      </div>
    </li>
  );
}

function TicketField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-fg-muted">{label}</dt>
      <dd className={`break-words ${strong ? "text-lg font-bold text-fg" : "font-semibold text-fg-2"}`}>{value}</dd>
    </div>
  );
}

/**
 * Paper version of a booking for `<PrintPortal>`: one cut-out ticket per seat, then the receipt (products, total).
 * Always black on white – it is printed, not themed.
 */
export function PrintableTickets({ booking }: { booking: Booking }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const showtime = booking.showtime;

  return (
    <div className="flex flex-col gap-4 bg-white p-4 font-sans text-black">
      {booking.tickets.map((ticket) => (
        <section key={ticket.id} className="flex break-inside-avoid items-center gap-4 rounded border border-black p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            {showtime && (
              <>
                <p className="text-xs font-bold uppercase">{showtime.cinema.name}</p>
                <p className="text-lg font-bold">
                  {showtime.movie.title} ({showtime.movie.ageRating})
                </p>
                <p>{formatDateTime(showtime.startTime, intlLocale)}</p>
                <p>
                  {t.booking.room}: {showtime.room.name} · {t.booking.ticket.seat}:{" "}
                  <span className="text-xl font-bold">{ticket.seatCode}</span>
                </p>
              </>
            )}
            <p>
              {t.booking.ticket.code}: <span className="font-mono font-bold">{ticket.ticketCode}</span> ·{" "}
              {formatVnd(ticket.price, intlLocale)}
            </p>
          </div>
          <QRCodeSVG value={ticket.qrToken} size={112} level="M" />
        </section>
      ))}
      <section className="break-inside-avoid rounded border border-dashed border-black p-4 text-sm">
        <p className="font-bold">
          {t.booking.bookingCode}: <span className="font-mono">{booking.bookingCode}</span>
        </p>
        {booking.items.map((item) => (
          <p key={item.productId} className="flex justify-between gap-4">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatVnd(item.totalPrice, intlLocale)}</span>
          </p>
        ))}
        <p className="mt-2 flex justify-between gap-4 text-base font-bold">
          <span>{t.booking.totalToPay}</span>
          <span>{formatVnd(booking.totalAmount, intlLocale)}</span>
        </p>
        {booking.soldBy && <p className="mt-1 text-xs">{t.booking.ticket.soldBy(booking.soldBy.fullName)}</p>}
      </section>
    </div>
  );
}
