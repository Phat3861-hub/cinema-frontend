"use client";

import { Armchair, Ban, CalendarClock, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/field";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CinemaScope } from "@/features/admin/components/cinema-scope";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { roomApi } from "@/features/cinema/api";
import { showtimeApi } from "@/features/showtime/api";
import { ShowtimeFormDialog } from "@/features/showtime/components/showtime-form-dialog";
import { SeatLegend, SeatMap } from "@/features/showtime/components/seat-map";
import { SHOWTIME_STATUSES, type Showtime, type ShowtimeSeat, type ShowtimeStatus } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useNow } from "@/hooks/use-now";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { addDays, dayParts, formatTime, formatVnd, toIsoDate, todayInVietnam } from "@/lib/format";

export const SHOWTIME_STATUS_TONE: Record<ShowtimeStatus, BadgeTone> = {
  OPEN: "success",
  SCHEDULED: "info",
  FINISHED: "neutral",
  CANCELLED: "danger",
};

/** Schedule of one cinema for staff: date range ≤ 31 days, room / status filters, grouped by day. */
export function AdminShowtimesScreen({ cinemaId }: { cinemaId: number }) {
  return <CinemaScope cinemaId={cinemaId}>{() => <Schedule cinemaId={cinemaId} />}</CinemaScope>;
}

function Schedule({ cinemaId }: { cinemaId: number }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { user } = useSession();
  const canManage = hasAny(user, ["SHOWTIME_MANAGE"]);
  const canBlock = hasAny(user, ["SEAT_BLOCK"]);
  const now = useNow();
  const today = todayInVietnam();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 6));
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState<ShowtimeStatus | "">("");
  const [dialog, setDialog] = useState<Showtime | "new" | null>(null);
  const [toCancel, setToCancel] = useState<Showtime | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [seatsOf, setSeatsOf] = useState<Showtime | null>(null);

  const rooms = useApi(`rooms:${cinemaId}`, () => roomApi.list(cinemaId));
  const filter = { from, to, roomId: roomId ? Number(roomId) : undefined, status: status || undefined };
  const showtimes = useApi(`admin-showtimes:${cinemaId}:${JSON.stringify(filter)}`, () => showtimeApi.forCinema(cinemaId, filter));

  const byDay = new Map<string, Showtime[]>();
  for (const s of [...(showtimes.data ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const day = toIsoDate(new Date(s.startTime));
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }

  async function confirmCancel() {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await showtimeApi.cancel(toCancel.id);
      toast.success(t.admin.showtimes.cancelled);
      setToCancel(null);
      showtimes.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setCancelling(false);
    }
  }

  const editable = (s: Showtime) => (s.status === "OPEN" || s.status === "SCHEDULED") && new Date(s.startTime).getTime() > now;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.showtimes.subtitle}</p>
        {canManage && (
          <Button size="md" onClick={() => setDialog("new")} disabled={!rooms.data?.length}>
            <Plus aria-hidden className="size-4" />
            {t.admin.showtimes.add}
          </Button>
        )}
      </div>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.showtimes.from}
            <input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} className={controlClasses({ size: "md" })} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.showtimes.to}
            <input
              type="date"
              value={to}
              min={from}
              max={addDays(from, 30)}
              onChange={(e) => e.target.value && setTo(e.target.value)}
              className={controlClasses({ size: "md" })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.showtimes.room}
            <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">{t.admin.showtimes.allRooms}</option>
              {rooms.data?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.roomType})
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.common.status}
            <Select value={status} onChange={(e) => setStatus(e.target.value as ShowtimeStatus | "")}>
              <option value="">{t.common.all}</option>
              {SHOWTIME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.showtime.status[s]}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {showtimes.error && !showtimes.data ? (
          <ErrorState error={showtimes.error} onRetry={showtimes.reload} />
        ) : showtimes.data && byDay.size === 0 ? (
          <EmptyState icon={CalendarClock} title={t.admin.showtimes.empty} description={rooms.data?.length === 0 ? t.admin.showtimes.noRooms : undefined} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.admin.showtimes.time}</Th>
                <Th>{t.admin.showtimes.movie}</Th>
                <Th>{t.admin.showtimes.room}</Th>
                <Th>{t.admin.showtimes.version}</Th>
                <Th>{t.admin.showtimes.basePrice}</Th>
                <Th>{t.admin.showtimes.seats}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!showtimes.data ? (
              <TableSkeleton columns={8} />
            ) : (
              [...byDay.entries()].map(([day, items]) => {
                const parts = dayParts(day, intlLocale);
                return (
                  <tbody key={day} className={showtimes.loading ? "opacity-60" : ""}>
                    <tr>
                      <th colSpan={8} scope="rowgroup" className="bg-surface-2 px-3 py-2 text-left text-xs font-bold tracking-wide text-fg-2 uppercase">
                        {day === today ? t.showtime.today : parts.weekday} · {parts.day}/{parts.month} · {t.admin.dashboard.showtimeCount(items.length)}
                      </th>
                    </tr>
                    {items.map((s) => (
                      <tr key={s.id} className={s.status === "CANCELLED" ? "opacity-60" : ""}>
                        <Td className="whitespace-nowrap">
                          <span className="font-bold text-fg">{formatTime(s.startTime, intlLocale)}</span>
                          <span className="text-fg-subtle"> – {formatTime(s.endTime, intlLocale)}</span>
                        </Td>
                        <Td className="max-w-52 truncate font-semibold text-fg">{s.movie.title}</Td>
                        <Td className="whitespace-nowrap">{s.room.name}</Td>
                        <Td className="whitespace-nowrap">
                          {s.format} · {t.showtime.audio[s.audioType]}
                        </Td>
                        <Td className="whitespace-nowrap">{formatVnd(s.basePrice, intlLocale)}</Td>
                        <Td className="whitespace-nowrap">
                          {s.availableSeats}/{s.totalSeats}
                        </Td>
                        <Td>
                          <Badge tone={SHOWTIME_STATUS_TONE[s.status]}>{t.showtime.status[s.status]}</Badge>
                        </Td>
                        <Td>
                          <div className="flex justify-end gap-1">
                            <IconButton label={t.admin.showtimes.viewSeats} onClick={() => setSeatsOf(s)}>
                              <Armchair aria-hidden className="size-4" />
                            </IconButton>
                            {canManage && editable(s) && (
                              <>
                                <IconButton label={t.common.edit} onClick={() => setDialog(s)}>
                                  <Pencil aria-hidden className="size-4" />
                                </IconButton>
                                <IconButton label={t.admin.showtimes.cancel} tone="danger" onClick={() => setToCancel(s)}>
                                  <Ban aria-hidden className="size-4" />
                                </IconButton>
                              </>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                );
              })
            )}
          </Table>
        )}
      </Card>

      {dialog !== null && rooms.data && (
        <ShowtimeFormDialog
          cinemaId={cinemaId}
          rooms={rooms.data}
          showtime={dialog === "new" ? undefined : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            showtimes.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title={t.admin.showtimes.cancelTitle}
        description={t.admin.showtimes.cancelText}
        confirmLabel={t.admin.showtimes.cancel}
      />
      {seatsOf && <ShowtimeSeatsDialog showtime={seatsOf} canBlock={canBlock && editable(seatsOf)} onClose={() => setSeatsOf(null)} />}
    </>
  );
}

/** Seat map of one showtime; with SEAT_BLOCK a free seat can be blocked for this showtime only (CIN-05). */
function ShowtimeSeatsDialog({ showtime, canBlock, onClose }: { showtime: Showtime; canBlock: boolean; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const seats = useApi(`seats:${showtime.id}`, () => showtimeApi.seats(showtime.id));
  const [busy, setBusy] = useState(false);

  async function toggle(seat: ShowtimeSeat & { id: number }) {
    setBusy(true);
    try {
      const next = await showtimeApi.setSeatBlocked(showtime.id, seat.seatId, seat.status !== "BLOCKED");
      seats.setData(() => next);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`${showtime.movie.title} · ${formatTime(showtime.startTime, intlLocale)}`}
      description={canBlock ? t.admin.showtimes.blockHelp : `${showtime.room.name} · ${showtime.format}`}
    >
      {seats.error && !seats.data ? (
        <ErrorState error={seats.error} onRetry={seats.reload} />
      ) : !seats.data ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-5">
          <SeatMap
            totalRows={seats.data.totalRows}
            totalColumns={seats.data.totalColumns}
            seats={seats.data.seats.map((s) => ({ ...s, id: s.seatId }))}
            seatTypes={seats.data.seatTypes}
            visual={(s) => (s.status === "BLOCKED" ? "blocked" : s.status === "AVAILABLE" ? "available" : "taken")}
            onSeat={canBlock ? toggle : undefined}
            isInteractive={(s) => !busy && (s.status === "AVAILABLE" || s.status === "BLOCKED")}
            seatLabel={(s) => `${s.seatCode} · ${t.seat.status[s.status]}`}
          />
          <SeatLegend seatTypes={seats.data.seatTypes} states={["available", "taken", "blocked"]} />
        </div>
      )}
    </Dialog>
  );
}
