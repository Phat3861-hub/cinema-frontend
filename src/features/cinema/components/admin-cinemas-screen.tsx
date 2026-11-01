"use client";

import { Building2, CalendarClock, Clapperboard, Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { cinemaApi } from "@/features/cinema/api";
import type { Cinema, CinemaStatus } from "@/features/cinema/types";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/** Strips accents for client-side search ("Hà Nội" matches "ha noi"), like the backend `unaccent`. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

/** Cinema table from `/cinemas/managed` (includes closed ones for global staff); filters run client-side. */
export function AdminCinemasScreen() {
  const t = useT();
  const toast = useToast();
  const { cinemas, loading, error, reload } = useAdminCinema();
  const [status, setStatus] = useState<CinemaStatus | "">("");
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [toDelete, setToDelete] = useState<Cinema | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cities = [...new Set(cinemas.map((c) => c.city))].sort();
  const q = fold(keyword.trim());
  const rows = cinemas.filter(
    (c) =>
      (!status || c.status === status) &&
      (!city || c.city === city) &&
      (!q || fold(`${c.name} ${c.address} ${c.district ?? ""}`).includes(q)),
  );

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await cinemaApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, t));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.cinemas.subtitle}</p>
        <Link href={ROUTES.admin.cinemaNew} className={buttonClasses({ size: "md" })}>
          <Plus aria-hidden className="size-4" />
          {t.admin.cinemas.add}
        </Link>
      </div>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <Tabs
          label={t.admin.common.status}
          value={status}
          onChange={setStatus}
          items={[
            { value: "", label: t.common.all, count: cinemas.length },
            { value: "ACTIVE", label: t.cinema.statusLabel.ACTIVE, count: cinemas.filter((c) => c.status === "ACTIVE").length },
            { value: "INACTIVE", label: t.cinema.statusLabel.INACTIVE, count: cinemas.filter((c) => c.status === "INACTIVE").length },
          ]}
        />
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label={t.cinema.searchLabel}
              placeholder={t.cinema.searchPlaceholder}
              className="h-10 w-full rounded border border-line-strong bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>
          <Select aria-label={t.cinema.city} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t.cinema.allCities}</option>
            {cities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        {error && cinemas.length === 0 ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !loading && rows.length === 0 ? (
          <EmptyState icon={Building2} title={t.cinema.empty} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.admin.cinemas.colCinema}</Th>
                <Th>{t.cinema.city}</Th>
                <Th>{t.admin.cinemas.address}</Th>
                <Th>{t.admin.cinemas.phone}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {loading && cinemas.length === 0 ? (
              <TableSkeleton columns={6} />
            ) : (
              <tbody>
                {rows.map((cinema) => (
                  <tr key={cinema.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-surface-3">
                          <CoverImage src={cinema.imageUrl} alt="" sizes="64px" />
                        </div>
                        <Link href={ROUTES.admin.cinemaEdit(cinema.id)} className="font-bold text-fg hover:underline">
                          {cinema.name}
                        </Link>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {cinema.city}
                      {cinema.district && <span className="block text-xs text-fg-subtle">{cinema.district}</span>}
                    </Td>
                    <Td className="max-w-64 truncate">{cinema.address}</Td>
                    <Td className="whitespace-nowrap">{cinema.phone ?? "—"}</Td>
                    <Td>
                      <Badge tone={cinema.status === "ACTIVE" ? "success" : "warning"}>{t.cinema.statusLabel[cinema.status]}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <RowLink href={ROUTES.admin.cinemaRooms(cinema.id)} label={t.admin.menu.rooms} icon={Clapperboard} />
                        <RowLink href={ROUTES.admin.cinemaShowtimes(cinema.id)} label={t.admin.menu.showtimes} icon={CalendarClock} />
                        <RowLink href={ROUTES.admin.cinemaStaff(cinema.id)} label={t.admin.menu.staff} icon={UsersRound} />
                        <RowLink href={ROUTES.admin.cinemaEdit(cinema.id)} label={t.common.editItem(cinema.name)} icon={Pencil} />
                        <IconButton label={t.common.deleteItem(cinema.name)} tone="danger" onClick={() => setToDelete(cinema)}>
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t.admin.cinemas.deleteTitle}
        description={toDelete ? t.admin.cinemas.deleteText(toDelete.name) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

function RowLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Pencil }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Icon aria-hidden className="size-4" />
    </Link>
  );
}
