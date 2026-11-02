"use client";

import { X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { SeatType, SeatTypeCode } from "@/features/cinema/types";
import { useT } from "@/i18n";

/** Minimal seat shape shared by the room layout (admin) and the showtime seat map (customer / admin). */
export interface MapSeat {
  id: number;
  rowLabel: string;
  /** 1-based grid column. */
  columnNumber: number;
  seatCode: string;
  seatType: SeatTypeCode;
  pairedSeatId: number | null;
}

export type SeatVisual = "available" | "selected" | "taken" | "blocked";

const VISUALS: Record<SeatVisual, string> = {
  available: "bg-surface-2 text-fg-2 hover:bg-primary/30",
  selected: "border-primary bg-primary text-black",
  taken: "border-transparent bg-primary-900 text-primary/50",
  blocked: "border-transparent bg-neutral-600 text-neutral-300",
};

/** `lg` = touch-size seats for the counter (POS). */
type SeatMapSize = "md" | "lg";

const SIZES: Record<SeatMapSize, { column: string; row: string; seat: string }> = {
  md: { column: "minmax(1.75rem, 2.25rem)", row: "2rem", seat: "h-8 text-[11px]" },
  lg: { column: "minmax(2.25rem, 3rem)", row: "2.75rem", seat: "h-11 text-xs" },
};

export function rowLabels(totalRows: number): string[] {
  return Array.from({ length: totalRows }, (_, i) => String.fromCharCode(65 + i));
}

/**
 * Seat grid with the screen on top and row letters on both sides. A couple seat is drawn once, spanning both
 * of its cells (the right half is skipped). `visual` / `onSeat` decide colour and click behaviour.
 */
export function SeatMap<S extends MapSeat>({
  totalRows,
  totalColumns,
  seats,
  seatTypes,
  visual,
  onSeat,
  isInteractive,
  seatLabel,
  size = "md",
}: {
  totalRows: number;
  totalColumns: number;
  seats: S[];
  seatTypes: SeatType[];
  visual: (seat: S) => SeatVisual;
  onSeat?: (seat: S) => void;
  isInteractive?: (seat: S) => boolean;
  seatLabel?: (seat: S) => string;
  size?: SeatMapSize;
}) {
  const t = useT();
  const colors = new Map(seatTypes.map((type) => [type.code, type.color]));
  const byId = new Map(seats.map((seat) => [seat.id, seat]));
  const rows = rowLabels(totalRows);
  const dims = SIZES[size];
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${totalColumns}, ${dims.column})` };

  const cells: ReactNode[] = [];
  for (const seat of seats) {
    const pair = seat.pairedSeatId !== null ? byId.get(seat.pairedSeatId) : undefined;
    // Draw a couple seat from its left half only.
    if (pair && pair.columnNumber < seat.columnNumber) continue;
    const span = pair ? 2 : 1;
    const look = visual(seat);
    const interactive = onSeat !== undefined && (isInteractive?.(seat) ?? true);
    const number = seat.seatCode.slice(seat.rowLabel.length);
    const code = pair ? `${seat.seatCode}-${pair.seatCode.slice(pair.rowLabel.length)}` : seat.seatCode;
    const style: CSSProperties = {
      gridRow: seat.rowLabel.charCodeAt(0) - 64,
      gridColumn: `${seat.columnNumber} / span ${span}`,
      ...(look === "available" && { borderColor: colors.get(seat.seatType) ?? undefined }),
    };
    const className =
      `flex ${dims.seat} items-center justify-center gap-1 rounded-t-lg rounded-b border-2 font-bold transition-colors ` +
      `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${VISUALS[look]} ` +
      (interactive ? "cursor-pointer" : "cursor-not-allowed");
    const content = look === "blocked" ? <X aria-hidden className="size-3.5" /> : pair ? `${number}·${pair.seatCode.slice(pair.rowLabel.length)}` : number;

    cells.push(
      onSeat ? (
        <button
          key={seat.id}
          type="button"
          style={style}
          className={className}
          disabled={!interactive}
          aria-pressed={look === "selected"}
          aria-label={seatLabel?.(seat) ?? code}
          title={seatLabel?.(seat) ?? code}
          onClick={() => onSeat(seat)}
        >
          {content}
        </button>
      ) : (
        <span key={seat.id} style={style} className={className} title={seatLabel?.(seat) ?? code}>
          {content}
        </span>
      ),
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex w-max flex-col items-center gap-6 px-2">
        <div className="flex w-full flex-col items-center gap-2" aria-hidden>
          <div className="h-2 w-full max-w-[90%] rounded-[50%] bg-linear-to-b from-primary to-transparent shadow-[0_8px_30px_-4px] shadow-primary/40" />
          <span className="text-xs font-bold tracking-[0.3em] text-fg-muted">{t.seat.screen}</span>
        </div>
        <div className="flex gap-2">
          <RowLetters rows={rows} height={dims.row} />
          <div className="grid gap-1.5" style={{ ...gridStyle, gridTemplateRows: `repeat(${totalRows}, ${dims.row})` }}>
            {cells}
          </div>
          <RowLetters rows={rows} height={dims.row} />
        </div>
      </div>
    </div>
  );
}

function RowLetters({ rows, height }: { rows: string[]; height: string }) {
  return (
    <div aria-hidden className="grid gap-1.5" style={{ gridTemplateRows: `repeat(${rows.length}, ${height})` }}>
      {rows.map((row) => (
        <span key={row} className="flex w-5 items-center justify-center text-xs font-bold text-fg-subtle">
          {row}
        </span>
      ))}
    </div>
  );
}

/** Legend: seat states + seat types (border colour + surcharge). */
export function SeatLegend({ seatTypes, states, surcharge }: { seatTypes: SeatType[]; states: SeatVisual[]; surcharge?: (amount: number) => string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3 text-xs font-semibold text-fg-2">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {states.map((state) => (
          <li key={state} className="flex items-center gap-2">
            <span aria-hidden className={`size-4 rounded border-2 ${VISUALS[state]} ${state === "available" ? "border-line-strong" : ""}`} />
            {t.seat.state[state]}
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {seatTypes.map((type) => (
          <li key={type.code} className="flex items-center gap-2">
            <span aria-hidden className="size-4 rounded border-2 bg-surface-2" style={{ borderColor: type.color ?? undefined }} />
            {t.seat.type[type.code] ?? type.name}
            {surcharge && type.surcharge > 0 && <span className="text-fg-subtle">+{surcharge(type.surcharge)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
