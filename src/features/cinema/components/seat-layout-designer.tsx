"use client";

import { ArrowLeft, Eraser, Lock, Minus, Paintbrush, Plus, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Segmented } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { roomApi } from "@/features/cinema/api";
import type { Room, SeatLayout, SeatTypeCode } from "@/features/cinema/types";
import { SeatLegend, SeatMap, rowLabels } from "@/features/showtime/components/seat-map";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

type Brush = "S" | "V" | "C" | ".";
const MAX_ROWS = 26;
const MAX_COLUMNS = 40;
const TYPE_OF: Record<Exclude<Brush, ".">, SeatTypeCode> = { S: "STANDARD", V: "VIP", C: "COUPLE" };

/** Rows whose couple cells (C) do not form adjacent pairs – the backend rejects them (INVALID_SEAT_LAYOUT). */
function badCoupleRows(grid: string[][]): string[] {
  const labels = rowLabels(grid.length);
  return grid.flatMap((row, r) => {
    const runs = row.join("").match(/C+/g) ?? [];
    return runs.some((run) => run.length % 2 === 1) ? [labels[r]] : [];
  });
}

/** `/admin/rooms/[roomId]/layout`: designer (SEAT_LAYOUT_MANAGE) and broken-seat blocking (SEAT_BLOCK). */
export function SeatLayoutScreen({ roomId }: { roomId: string }) {
  const t = useT();
  const { user } = useSession();
  const room = useApi(`room:${roomId}`, () => roomApi.get(roomId));
  const layout = useApi(`layout:${roomId}`, () => roomApi.layout(roomId));
  const canDesign = hasAny(user, ["SEAT_LAYOUT_MANAGE"]);
  const canBlock = hasAny(user, ["SEAT_BLOCK"]);
  const [mode, setMode] = useState<"design" | "block">(canDesign ? "design" : "block");

  const error = room.error ?? layout.error;
  if (error && !(room.data && layout.data)) return <ErrorState error={error} onRetry={() => (room.reload(), layout.reload())} />;
  if (!room.data || !layout.data) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={ROUTES.admin.cinemaRooms(room.data.cinemaId)} className={buttonClasses({ variant: "ghost", size: "md" })}>
            <ArrowLeft aria-hidden className="size-4" />
            {t.admin.layout.backToRooms}
          </Link>
          <p className="text-h8">
            {room.data.name} <span className="text-sm font-semibold text-fg-muted">· {room.data.roomType}</span>
          </p>
        </div>
        {canDesign && canBlock && (
          <Segmented
            label={t.admin.layout.mode}
            value={mode}
            onChange={setMode}
            items={[
              { value: "design", label: t.admin.layout.designMode },
              { value: "block", label: t.admin.layout.blockMode },
            ]}
          />
        )}
      </div>

      {mode === "design" && canDesign ? (
        <Designer key={layout.data.grid.join("|")} room={room.data} layout={layout.data} onSaved={(next) => layout.setData(() => next)} />
      ) : (
        <BlockSeats layout={layout.data} onChanged={(next) => layout.setData(() => next)} readOnly={!canBlock} />
      )}
    </div>
  );
}

function Designer({ room, layout, onSaved }: { room: Room; layout: SeatLayout; onSaved: (layout: SeatLayout) => void }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const initial = layout.grid.map((row) => row.split(""));
  const [grid, setGrid] = useState<string[][]>(initial);
  const [brush, setBrush] = useState<Brush>("S");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const painting = useRef(false);

  const dirty = grid.map((r) => r.join("")).join("|") !== layout.grid.join("|");
  const bad = badCoupleRows(grid);
  const counts = { S: 0, V: 0, C: 0 };
  grid.forEach((row) => row.forEach((cell) => cell in counts && counts[cell as keyof typeof counts]++));

  useEffect(() => {
    const stop = () => (painting.current = false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function paint(r: number, c: number) {
    setGrid((current) => {
      const next = current.map((row) => [...row]);
      next[r][c] = brush;
      // The couple brush paints a pair: the clicked cell + its right neighbour (or left one at the edge).
      if (brush === "C") {
        const mate = c + 1 < next[r].length ? c + 1 : c - 1;
        if (mate >= 0) next[r][mate] = "C";
      }
      return next;
    });
  }

  function fillRow(r: number) {
    setGrid((current) => {
      const next = current.map((row) => [...row]);
      next[r] = next[r].map(() => brush);
      if (brush === "C" && next[r].length % 2 === 1) next[r][next[r].length - 1] = ".";
      return next;
    });
  }

  const columns = grid[0]?.length ?? 0;
  const resize = (dRows: number, dCols: number) =>
    setGrid((current) => {
      let next = current.map((row) => [...row]);
      if (dRows > 0 && next.length < MAX_ROWS) next.push(Array.from({ length: columns }, () => "S"));
      if (dRows < 0 && next.length > 1) next = next.slice(0, -1);
      if (dCols > 0 && columns < MAX_COLUMNS) next = next.map((row) => [...row, "S"]);
      if (dCols < 0 && columns > 1) next = next.map((row) => row.slice(0, -1));
      return next;
    });

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await roomApi.saveLayout(room.id, grid.map((row) => row.join("")));
      toast.success(t.admin.layout.saved);
      onSaved(saved);
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  }

  const colors = new Map(layout.seatTypes.map((type) => [type.code, type.color]));
  const brushes: { value: Brush; label: string; icon?: typeof Eraser }[] = [
    { value: "S", label: t.seat.type.STANDARD },
    { value: "V", label: t.seat.type.VIP },
    { value: "C", label: t.seat.type.COUPLE },
    { value: ".", label: t.admin.layout.aisle, icon: Eraser },
  ];
  const labels = rowLabels(grid.length);
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${columns}, 2rem)` };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
            <Paintbrush aria-hidden className="size-4" />
            {t.admin.layout.brush}
          </span>
          <div role="group" aria-label={t.admin.layout.brush} className="flex flex-wrap gap-2">
            {brushes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={brush === value}
                onClick={() => setBrush(value)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${
                  brush === value ? "border-primary bg-primary text-black" : "border-line text-fg-2 hover:bg-surface-2"
                }`}
              >
                {Icon ? (
                  <Icon aria-hidden className="size-4" />
                ) : (
                  <span
                    aria-hidden
                    className="size-3.5 rounded-sm border-2"
                    style={{ borderColor: colors.get(TYPE_OF[value as Exclude<Brush, ".">]) ?? undefined }}
                  />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-medium text-fg-muted">{t.admin.layout.help}</p>

        <div className="overflow-x-auto pb-2">
          <div className="mx-auto flex w-max flex-col items-center gap-5 px-2 select-none">
            <div className="flex w-full flex-col items-center gap-2" aria-hidden>
              <div className="h-2 w-[90%] rounded-[50%] bg-linear-to-b from-primary to-transparent" />
              <span className="text-xs font-bold tracking-[0.3em] text-fg-muted">{t.seat.screen}</span>
            </div>
            <div className="flex flex-col gap-1.5" onPointerLeave={() => (painting.current = false)}>
              {grid.map((row, r) => (
                <div key={r} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillRow(r)}
                    title={t.admin.layout.fillRow(labels[r])}
                    aria-label={t.admin.layout.fillRow(labels[r])}
                    className="flex size-7 cursor-pointer items-center justify-center rounded text-xs font-bold text-fg-subtle hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {labels[r]}
                  </button>
                  <div className="grid gap-1.5" style={gridStyle}>
                    {row.map((cell, c) => {
                      const type = cell === "." ? null : TYPE_OF[cell as Exclude<Brush, ".">];
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-label={`${labels[r]}${c + 1}: ${type ? t.seat.type[type] : t.admin.layout.aisle}`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            painting.current = true;
                            paint(r, c);
                          }}
                          onPointerEnter={() => painting.current && paint(r, c)}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), paint(r, c))}
                          className={`size-8 cursor-crosshair rounded-t-lg rounded-b border-2 text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-accent ${
                            type ? "bg-surface-2 text-fg-2" : "border-dashed border-line bg-transparent"
                          } ${bad.includes(labels[r]) && cell === "C" ? "ring-2 ring-danger" : ""}`}
                          style={type ? { borderColor: colors.get(type) ?? undefined } : undefined}
                        >
                          {type ? cell : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => resize(1, 0)} disabled={grid.length >= MAX_ROWS}>
            <Plus aria-hidden className="size-3.5" />
            {t.admin.layout.addRow}
          </Button>
          <Button variant="outline" size="sm" onClick={() => resize(-1, 0)} disabled={grid.length <= 1}>
            <Minus aria-hidden className="size-3.5" />
            {t.admin.layout.removeRow}
          </Button>
          <Button variant="outline" size="sm" onClick={() => resize(0, 1)} disabled={columns >= MAX_COLUMNS}>
            <Plus aria-hidden className="size-3.5" />
            {t.admin.layout.addColumn}
          </Button>
          <Button variant="outline" size="sm" onClick={() => resize(0, -1)} disabled={columns <= 1}>
            <Minus aria-hidden className="size-3.5" />
            {t.admin.layout.removeColumn}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-5 xl:sticky xl:top-28">
        <p className="text-h8">{t.admin.layout.summary}</p>
        <dl className="flex flex-col gap-2 text-sm font-medium">
          <SummaryRow label={t.admin.rooms.size} value={`${grid.length} × ${columns}`} />
          {(["S", "V", "C"] as const).map((symbol) => {
            const type = layout.seatTypes.find((st) => st.code === TYPE_OF[symbol]);
            return (
              <SummaryRow
                key={symbol}
                label={t.seat.type[TYPE_OF[symbol]]}
                value={`${counts[symbol]}${type && type.surcharge > 0 ? ` · +${formatVnd(type.surcharge, intlLocale)}` : ""}`}
              />
            );
          })}
          <SummaryRow label={t.admin.layout.totalSeats} value={String(counts.S + counts.V + counts.C)} strong />
        </dl>
        {bad.length > 0 && <Alert tone="warning">{t.admin.layout.badCouple(bad.join(", "))}</Alert>}
        {saveError !== null && <Alert tone="error">{getErrorMessage(saveError, t)}</Alert>}
        <Button onClick={save} loading={saving} disabled={!dirty || bad.length > 0 || counts.S + counts.V + counts.C === 0} fullWidth>
          <Save aria-hidden className="size-4" />
          {t.admin.layout.save}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setGrid(initial)} disabled={!dirty}>
          <RotateCcw aria-hidden className="size-4" />
          {t.admin.layout.reset}
        </Button>
        <p className="text-xs font-medium text-fg-muted">{t.admin.layout.lockedHint}</p>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "border-t border-line pt-2 font-bold" : ""}`}>
      <dt className="text-fg-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Block / unblock broken seats; a couple seat is blocked as a pair (backend). */
function BlockSeats({ layout, onChanged, readOnly }: { layout: SeatLayout; onChanged: (layout: SeatLayout) => void; readOnly: boolean }) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const blocked = layout.seats.filter((seat) => !seat.active).length;

  async function toggle(seat: SeatLayout["seats"][number]) {
    setBusy(seat.id);
    try {
      onChanged(await roomApi.setSeatActive(layout.roomId, seat.id, !seat.active));
      toast.success(seat.active ? t.admin.layout.seatBlocked(seat.seatCode) : t.admin.layout.seatUnblocked(seat.seatCode));
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Lock aria-hidden className="size-5 text-fg-muted" />
        <p className="flex-1 text-sm font-medium text-fg-muted">{readOnly ? t.admin.layout.readOnly : t.admin.layout.blockHelp}</p>
        <span className="text-sm font-bold">{t.admin.layout.blockedCount(blocked)}</span>
      </div>
      <SeatMap
        totalRows={layout.totalRows}
        totalColumns={layout.totalColumns}
        seats={layout.seats}
        seatTypes={layout.seatTypes}
        visual={(seat) => (seat.active ? "available" : "blocked")}
        onSeat={readOnly ? undefined : toggle}
        isInteractive={() => busy === null}
        seatLabel={(seat) => `${seat.seatCode} · ${seat.active ? t.admin.layout.clickToBlock : t.admin.layout.clickToUnblock}`}
      />
      <SeatLegend seatTypes={layout.seatTypes} states={["available", "blocked"]} />
    </Card>
  );
}
