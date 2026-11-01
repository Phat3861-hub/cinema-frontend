"use client";

import { LocateFixed, MapPin, Phone, Search, X } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { cinemaApi } from "@/features/cinema/api";
import type { Cinema } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";

type Position = { lat: number; lng: number };
type GeoState = { kind: "idle" } | { kind: "locating" } | { kind: "on"; position: Position } | { kind: "denied" };

/** `/cinemas`: city filter, accent-insensitive search and "near me" (browser geolocation → distance in km). */
export function CinemasScreen() {
  const t = useT();
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typed, setTyped] = useState("");
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });

  const position = geo.kind === "on" ? geo.position : undefined;
  const filter = { city: city || undefined, keyword: keyword || undefined, lat: position?.lat, lng: position?.lng };
  const cinemas = useApi(`cinemas:${JSON.stringify(filter)}`, () => cinemaApi.list(filter));
  const cities = useApi("cities", cinemaApi.cities);

  function locate() {
    if (geo.kind === "on") return setGeo({ kind: "idle" });
    if (!("geolocation" in navigator)) return setGeo({ kind: "denied" });
    setGeo({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: "on", position: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      () => setGeo({ kind: "denied" }),
      { timeout: 10000 },
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setKeyword(typed.trim());
  }

  return (
    <section className="mx-auto flex w-full max-w-[1232px] flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h6 sm:text-h4">{t.cinema.listTitle}</h1>
        <p className="text-sm font-medium text-fg-muted">{t.cinema.listSubtitle}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 md:flex-row md:items-center">
        <Select aria-label={t.cinema.city} value={city} onChange={(e) => setCity(e.target.value)} className="md:w-56">
          <option value="">{t.cinema.allCities}</option>
          {cities.data?.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <form role="search" onSubmit={submit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label={t.cinema.searchLabel}
              placeholder={t.cinema.searchPlaceholder}
              className="h-10 w-full rounded border border-line-strong bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>
          <Button type="submit" size="md">
            {t.common.search}
          </Button>
        </form>
        <Button
          variant={geo.kind === "on" ? "primary" : "outline"}
          size="md"
          onClick={locate}
          loading={geo.kind === "locating"}
          aria-pressed={geo.kind === "on"}
        >
          {geo.kind === "on" ? <X aria-hidden className="size-4" /> : <LocateFixed aria-hidden className="size-4" />}
          {t.cinema.nearMe}
        </Button>
      </div>

      {geo.kind === "denied" && <Alert tone="warning">{t.cinema.geoDenied}</Alert>}

      {cinemas.error && !cinemas.data ? (
        <ErrorState error={cinemas.error} onRetry={cinemas.reload} />
      ) : cinemas.loading && !cinemas.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : cinemas.data && cinemas.data.length > 0 ? (
        <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cinemas.loading ? "opacity-60" : ""}`}>
          {cinemas.data.map((cinema) => (
            <li key={cinema.id}>
              <CinemaCard cinema={cinema} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title={t.cinema.empty} />
      )}
    </section>
  );
}

export function CinemaCard({ cinema }: { cinema: Cinema }) {
  const t = useT();
  return (
    <Link
      href={ROUTES.cinemaDetail(cinema.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[16/9] bg-surface-3">
        <CoverImage src={cinema.imageUrl} alt={cinema.name} sizes="(min-width: 1024px) 400px, 100vw" />
        {cinema.distanceKm !== null && (
          <span className="absolute top-3 right-3 rounded bg-primary px-2 py-1 text-xs font-bold text-black">
            {t.cinema.distance(cinema.distanceKm)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-h8 group-hover:text-accent">{cinema.name}</h2>
        <p className="flex items-start gap-1.5 text-sm font-medium text-info">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
          {[cinema.address, cinema.district, cinema.city].filter(Boolean).join(", ")}
        </p>
        {cinema.phone && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-fg-muted">
            <Phone aria-hidden className="size-4" />
            {cinema.phone}
          </p>
        )}
      </div>
    </Link>
  );
}
