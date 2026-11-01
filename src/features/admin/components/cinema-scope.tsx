"use client";

import { Building2, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import type { Cinema } from "@/features/cinema/types";
import { useT } from "@/i18n";

type Section = "rooms" | "staff" | "showtimes";

const TARGETS: Record<Section, (id: number) => string> = {
  rooms: ROUTES.admin.cinemaRooms,
  staff: ROUTES.admin.cinemaStaff,
  showtimes: ROUTES.admin.cinemaShowtimes,
};

/** `/admin/rooms`, `/admin/staff`, `/admin/showtimes`: jump to the selected cinema's page. */
export function CinemaRedirect({ section }: { section: Section }) {
  const t = useT();
  const router = useRouter();
  const { selected, loading } = useAdminCinema();

  useEffect(() => {
    if (selected) router.replace(TARGETS[section](selected.id));
  }, [selected, section, router]);

  if (loading || selected) return <LoadingState />;
  return <EmptyState icon={Building2} title={t.admin.noCinema} description={t.admin.noCinemaHint} />;
}

/**
 * Wraps a per-cinema page (`/admin/cinemas/[cinemaId]/…`): remembers the cinema as the topbar selection and
 * shows its name. The backend still answers 403 when the user has no role for that cinema.
 */
export function CinemaScope({ cinemaId, children }: { cinemaId: number; children: (cinema: Cinema | undefined) => ReactNode }) {
  const t = useT();
  const { cinemas, select, loading } = useAdminCinema();
  const cinema = cinemas.find((c) => c.id === cinemaId);

  useEffect(() => {
    if (cinema) select(cinema.id);
  }, [cinema, select]);

  if (loading && !cinema) return <LoadingState />;
  // Not one of the user's managed cinemas (opened by URL): the backend would answer 403 to every call.
  if (!cinema && cinemas.length > 0) {
    return <EmptyState icon={ShieldOff} title={t.admin.forbiddenTitle} description={t.admin.forbiddenText} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {cinema && (
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg-muted">
          <Building2 aria-hidden className="size-4" />
          <span className="text-fg">{cinema.name}</span>
          <span>· {cinema.city}</span>
          {cinema.status === "INACTIVE" && <Badge tone="warning">{t.cinema.statusLabel.INACTIVE}</Badge>}
        </div>
      )}
      {children(cinema)}
    </div>
  );
}
