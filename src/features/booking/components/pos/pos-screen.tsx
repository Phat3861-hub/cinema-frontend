"use client";

import { Building2, Store } from "lucide-react";
import { useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { PosReceipt } from "@/features/booking/components/pos/pos-receipt";
import { PosSale } from "@/features/booking/components/pos/pos-sale";
import { PosShowtimePicker } from "@/features/booking/components/pos/pos-showtime-picker";
import type { Booking } from "@/features/booking/types";
import type { Showtime } from "@/features/showtime/types";
import { useT } from "@/i18n";

type Stage = { kind: "pick" } | { kind: "sell"; showtime: Showtime } | { kind: "done"; booking: Booking; received: number };

/**
 * Counter sale (BOK-09, `/admin/pos`) for the cinema picked in the topbar: showtime → seats + snacks → cash →
 * receipt with printable tickets. Seats use the same locking as online holds, so the counter and the website
 * never sell a seat twice.
 */
export function PosScreen() {
  const t = useT();
  const { selected: cinema, loading } = useAdminCinema();
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  // Switching cinema in the topbar starts over.
  const [cinemaOfStage, setCinemaOfStage] = useState<number | null>(null);
  if (cinema && cinema.id !== cinemaOfStage) {
    setCinemaOfStage(cinema.id);
    setStage({ kind: "pick" });
  }

  if (loading && !cinema) return <LoadingState />;
  if (!cinema) return <EmptyState icon={Building2} title={t.admin.noCinema} description={t.admin.noCinemaHint} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg-muted">
        <Store aria-hidden className="size-4" />
        <span className="text-fg">{cinema.name}</span>
        <span>· {t.admin.pos.cashOnly}</span>
      </p>

      {stage.kind === "pick" && (
        <PosShowtimePicker cinemaId={cinema.id} onPick={(showtime) => setStage({ kind: "sell", showtime })} />
      )}
      {stage.kind === "sell" && (
        <PosSale
          key={stage.showtime.id}
          cinemaId={cinema.id}
          showtime={stage.showtime}
          onChangeShowtime={() => setStage({ kind: "pick" })}
          onSold={(booking, received) => setStage({ kind: "done", booking, received })}
        />
      )}
      {stage.kind === "done" && (
        <PosReceipt
          booking={stage.booking}
          received={stage.received}
          onNext={() => setStage(stage.booking.showtime ? { kind: "sell", showtime: stage.booking.showtime } : { kind: "pick" })}
        />
      )}
    </div>
  );
}
