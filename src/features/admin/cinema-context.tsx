"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cinemaApi } from "@/features/cinema/api";
import type { Cinema } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { ADMIN_CINEMA_COOKIE, readCookie, writeCookie } from "@/lib/preferences";

interface AdminCinemaValue {
  /** `GET /cinemas/managed`: every cinema for global staff, own cinema(s) for cinema staff. */
  cinemas: Cinema[];
  loading: boolean;
  error: unknown;
  selected: Cinema | null;
  select: (cinemaId: number) => void;
  reload: () => void;
}

const AdminCinemaContext = createContext<AdminCinemaValue | null>(null);

/** Cinema picker state of the admin topbar; the last choice is remembered in a cookie (docs/ui-design.md §5.3). */
export function AdminCinemaProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useApi("admin:managed-cinemas", cinemaApi.managed);
  const [pickedId, setPickedId] = useState<number | null>(() => {
    const saved = Number(readCookie(ADMIN_CINEMA_COOKIE));
    return Number.isFinite(saved) && saved > 0 ? saved : null;
  });

  const cinemas = useMemo(() => data ?? [], [data]);
  const selected = cinemas.find((c) => c.id === pickedId) ?? cinemas[0] ?? null;

  const select = useCallback((cinemaId: number) => {
    setPickedId(cinemaId);
    writeCookie(ADMIN_CINEMA_COOKIE, String(cinemaId));
  }, []);

  const value = useMemo(
    () => ({ cinemas, loading, error, selected, select, reload }),
    [cinemas, loading, error, selected, select, reload],
  );
  return <AdminCinemaContext value={value}>{children}</AdminCinemaContext>;
}

export function useAdminCinema(): AdminCinemaValue {
  const context = useContext(AdminCinemaContext);
  if (!context) throw new Error("useAdminCinema must be used inside <AdminCinemaProvider>");
  return context;
}
