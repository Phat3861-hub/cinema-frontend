"use client";

import { Building2, Eye, Printer, ReceiptText, Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { PrintPortal } from "@/components/ui/print-portal";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { cinemaBookingApi } from "@/features/booking/api";
import { BOOKING_STATUS_TONES } from "@/features/booking/components/my-bookings";
import { PrintableTickets, TICKET_TONES } from "@/features/booking/components/ticket-card";
import {
  BOOKING_CHANNELS,
  BOOKING_STATUSES,
  type Booking,
  type BookingChannel,
  type BookingStatus,
  type CinemaBookingFilter,
} from "@/features/booking/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { addDays, formatDateTime, formatTime, formatVnd, todayInVietnam } from "@/lib/format";

const PAGE_SIZE = 20;
/** Backend limit of the showtime-day range. */
const MAX_RANGE_DAYS = 31;

/** Bookings of the cinema picked in the topbar (BOOKING_VIEW_CINEMA / BOOKING_VIEW_ALL). */
export function AdminBookingsScreen() {
  const t = useT();
  const { selected: cinema, loading } = useAdminCinema();
  if (loading && !cinema) return <LoadingState />;
  if (!cinema) return <EmptyState icon={Building2} title={t.admin.noCinema} description={t.admin.noCinemaHint} />;
  return <CinemaBookings key={cinema.id} cinemaId={cinema.id} cinemaName={cinema.name} />;
}

function CinemaBookings({ cinemaId, cinemaName }: { cinemaId: number; cinemaName: string }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const today = todayInVietnam();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [channel, setChannel] = useState<BookingChannel | "">("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Booking | null>(null);

  const filter: CinemaBookingFilter = code
    ? { code, size: PAGE_SIZE }
    : {
        from,
        to,
        status: status || undefined,
        channel: channel || undefined,
        keyword: keyword || undefined,
        page,
        size: PAGE_SIZE,
      };
  const bookings = useApi(`cinema-bookings:${cinemaId}:${JSON.stringify(filter)}`, () => cinemaBookingApi.list(cinemaId, filter));

  function search(event: FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(0);
  }

  function lookUp(event: FormEvent) {
    event.preventDefault();
    setCode(codeInput.trim());
  }

  const content = bookings.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
          <Building2 aria-hidden className="size-4" />
          <span className="text-fg">{cinemaName}</span>· {t.admin.bookings.subtitle}
        </p>
        <form onSubmit={lookUp} className="flex items-center gap-2" role="search" aria-label={t.admin.bookings.lookup}>
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder={t.admin.bookings.codePlaceholder}
            aria-label={t.admin.bookings.lookup}
            maxLength={20}
            className={`${controlClasses({ size: "md" })} w-44 font-mono`}
          />
          <Button type="submit" size="md" className="shrink-0 whitespace-nowrap" disabled={!codeInput.trim()}>
            <Search aria-hidden className="size-4" />
            {t.admin.bookings.lookupButton}
          </Button>
        </form>
      </div>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        {code ? (
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {t.admin.bookings.lookingUp}
            <span className="rounded bg-surface-2 px-2 py-1 font-mono">{code}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCode("");
                setCodeInput("");
              }}
            >
              <X aria-hidden className="size-4" />
              {t.admin.bookings.clearLookup}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.bookings.from}
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setFrom(e.target.value);
                  if (to < e.target.value || to > addDays(e.target.value, MAX_RANGE_DAYS - 1)) setTo(e.target.value);
                  setPage(0);
                }}
                className={controlClasses({ size: "md" })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.bookings.to}
              <input
                type="date"
                value={to}
                min={from}
                max={addDays(from, MAX_RANGE_DAYS - 1)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setTo(e.target.value);
                  setPage(0);
                }}
                className={controlClasses({ size: "md" })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.common.status}
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as BookingStatus | "");
                  setPage(0);
                }}
              >
                <option value="">{t.common.all}</option>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t.booking.status[s]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.bookings.channel}
              <Select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as BookingChannel | "");
                  setPage(0);
                }}
              >
                <option value="">{t.common.all}</option>
                {BOOKING_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {t.booking.channel[c]}
                  </option>
                ))}
              </Select>
            </label>
            <form onSubmit={search} className="flex flex-col gap-1 text-xs font-semibold text-fg-muted" role="search">
              <label htmlFor="booking-keyword">{t.admin.bookings.keyword}</label>
              <div className="flex gap-2">
                <input
                  id="booking-keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder={t.admin.bookings.keywordPlaceholder}
                  maxLength={100}
                  className={controlClasses({ size: "md" })}
                />
                <IconButton type="submit" label={t.admin.bookings.search} className="size-10 border border-line-strong">
                  <Search aria-hidden className="size-4" />
                </IconButton>
              </div>
            </form>
          </div>
        )}

        {bookings.error && !bookings.data ? (
          <ErrorState error={bookings.error} onRetry={bookings.reload} />
        ) : (
          <>
            <Table className="min-w-[960px]">
              <thead>
                <tr>
                  <Th>{t.booking.bookingCode}</Th>
                  <Th>{t.booking.time}</Th>
                  <Th>{t.booking.seats}</Th>
                  <Th>{t.admin.bookings.customer}</Th>
                  <Th>{t.admin.bookings.channel}</Th>
                  <Th className="text-right">{t.booking.totalToPay}</Th>
                  <Th>{t.admin.common.status}</Th>
                  <Th>{t.admin.bookings.createdAt}</Th>
                  <Th className="text-right">{t.admin.common.actions}</Th>
                </tr>
              </thead>
              {!bookings.data ? (
                <TableSkeleton columns={9} />
              ) : (
                <tbody>
                  {content.map((booking) => (
                    <tr key={booking.id} className="hover:bg-surface-2/50">
                      <Td>
                        <button
                          type="button"
                          onClick={() => setDetail(booking)}
                          className="cursor-pointer font-mono font-bold text-fg hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {booking.bookingCode}
                        </button>
                      </Td>
                      <Td>
                        {booking.showtime ? (
                          <div className="min-w-0">
                            <p className="font-semibold text-fg">{booking.showtime.movie.title}</p>
                            <p className="text-xs text-fg-muted">
                              {formatDateTime(booking.showtime.startTime, intlLocale)} · {booking.showtime.room.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-fg-subtle">–</span>
                        )}
                      </Td>
                      <Td>
                        {booking.seats.map((seat) => seat.seatCode).join(", ") ||
                          booking.tickets.map((x) => x.seatCode).join(", ") ||
                          "–"}
                      </Td>
                      <Td>
                        <CustomerCell booking={booking} />
                      </Td>
                      <Td>
                        <Badge tone={booking.channel === "COUNTER" ? "accent" : "info"}>
                          {t.booking.channel[booking.channel]}
                        </Badge>
                      </Td>
                      <Td className="text-right font-semibold whitespace-nowrap text-fg tabular-nums">
                        {formatVnd(booking.totalAmount, intlLocale)}
                      </Td>
                      <Td>
                        <Badge tone={BOOKING_STATUS_TONES[booking.status]}>{t.booking.status[booking.status]}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap">{formatDateTime(booking.createdAt, intlLocale)}</Td>
                      <Td className="text-right">
                        <IconButton label={t.admin.bookings.view(booking.bookingCode)} onClick={() => setDetail(booking)}>
                          <Eye aria-hidden className="size-4" />
                        </IconButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              )}
            </Table>
            {bookings.data && content.length === 0 && (
              <EmptyState icon={ReceiptText} title={code ? t.admin.bookings.notFound : t.admin.bookings.empty} />
            )}
            {bookings.data && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-fg-muted">{t.admin.bookings.total(bookings.data.totalElements)}</p>
                <Pagination page={bookings.data.page} totalPages={bookings.data.totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      <BookingDetailDialog booking={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function CustomerCell({ booking }: { booking: Booking }) {
  const t = useT();
  const customer = booking.customer;
  if (!customer) return <span className="text-fg-subtle">{t.admin.bookings.walkIn}</span>;
  return (
    <div className="min-w-0">
      <p className="font-semibold text-fg">{customer.name ?? customer.phone ?? customer.email}</p>
      <p className="text-xs text-fg-muted">{[customer.phone, customer.email].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

function BookingDetailDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const showtime = booking?.showtime;

  return (
    <Dialog
      open={booking !== null}
      onClose={onClose}
      size="lg"
      title={booking ? t.admin.bookings.detailTitle(booking.bookingCode) : ""}
      footer={
        <>
          {booking && booking.tickets.length > 0 && (
            <Button variant="outline" size="md" onClick={() => window.print()}>
              <Printer aria-hidden className="size-4" />
              {t.admin.bookings.reprint}
            </Button>
          )}
          <Button size="md" onClick={onClose}>
            {t.common.close}
          </Button>
        </>
      }
    >
      {booking && (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge tone={BOOKING_STATUS_TONES[booking.status]}>{t.booking.status[booking.status]}</Badge>
            <Badge tone={booking.channel === "COUNTER" ? "accent" : "info"}>{t.booking.channel[booking.channel]}</Badge>
          </div>

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {showtime && (
              <>
                <Info label={t.admin.bookings.movie} value={showtime.movie.title} />
                <Info
                  label={t.booking.time}
                  value={`${formatDateTime(showtime.startTime, intlLocale)} · ${showtime.room.name}`}
                />
              </>
            )}
            <Info
              label={t.admin.bookings.customer}
              value={
                booking.customer
                  ? [booking.customer.name, booking.customer.phone, booking.customer.email].filter(Boolean).join(" · ") +
                    (booking.customer.userId != null ? ` (${t.admin.bookings.hasAccount})` : "")
                  : t.admin.bookings.walkIn
              }
            />
            <Info label={t.admin.bookings.soldBy} value={booking.soldBy ? booking.soldBy.fullName : t.admin.bookings.online} />
            <Info label={t.admin.bookings.createdAt} value={formatDateTime(booking.createdAt, intlLocale)} />
            {booking.confirmedAt && (
              <Info label={t.admin.bookings.confirmedAt} value={formatDateTime(booking.confirmedAt, intlLocale)} />
            )}
            {booking.status === "PENDING" && booking.expiresAt && (
              <Info label={t.admin.bookings.heldUntil} value={formatTime(booking.expiresAt, intlLocale)} />
            )}
            {booking.cancelledAt && (
              <Info label={t.admin.bookings.cancelledAt} value={formatDateTime(booking.cancelledAt, intlLocale)} />
            )}
          </dl>

          {booking.tickets.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold tracking-wide text-fg-muted uppercase">{t.admin.bookings.tickets}</h3>
              <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
                {booking.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                    <span className="font-bold">{ticket.seatCode}</span>
                    <span className="font-mono text-xs text-fg-muted">{ticket.ticketCode}</span>
                    <span className="tabular-nums">{formatVnd(ticket.price, intlLocale)}</span>
                    <Badge tone={TICKET_TONES[ticket.status]}>{t.booking.ticket.status[ticket.status]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            booking.seats.length > 0 && (
              <Info label={t.booking.seats} value={booking.seats.map((seat) => seat.seatCode).join(", ")} />
            )
          )}

          {booking.items.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold tracking-wide text-fg-muted uppercase">{t.booking.snacks}</h3>
              {booking.items.map((item) => (
                <p key={item.productId} className="flex justify-between gap-4 font-medium">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="tabular-nums">{formatVnd(item.totalPrice, intlLocale)}</span>
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="font-semibold text-fg-muted">{t.booking.totalToPay}</span>
            <span className="text-xl font-bold tabular-nums">{formatVnd(booking.totalAmount, intlLocale)}</span>
          </div>

          {booking.tickets.length > 0 && (
            <PrintPortal>
              <PrintableTickets booking={booking} />
            </PrintPortal>
          )}
        </div>
      )}
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-fg-muted">{label}</dt>
      <dd className="font-semibold break-words text-fg">{value}</dd>
    </div>
  );
}
