"use client";

import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { Segmented } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import type { Room, RoomType } from "@/features/cinema/types";
import { movieApi } from "@/features/movie/api";
import { showtimeApi } from "@/features/showtime/api";
import { AUDIO_TYPES, type AudioType, type Showtime, type ShowtimeConflict } from "@/features/showtime/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-messages";
import { addDays, formatDateTime, instantToVietnamTime, toIsoDate, todayInVietnam, vietnamToInstant } from "@/lib/format";

/** Create one showtime / a batch (every time × every day, all-or-nothing) or edit one. Times are Vietnam time. */
export function ShowtimeFormDialog({
  cinemaId,
  rooms,
  showtime,
  onClose,
  onSaved,
}: {
  cinemaId: number;
  rooms: Room[];
  showtime?: Showtime;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { user } = useSession();
  // Changing the price of an existing showtime also needs PRICE_MANAGE (backend SHO-03).
  const priceLocked = !!showtime && !hasAny(user, ["PRICE_MANAGE"]);
  const today = todayInVietnam();

  const nowShowing = useApi("st-form:now", () => movieApi.search({ status: "NOW_SHOWING", size: 100, sort: "title,asc" }));
  const comingSoon = useApi("st-form:soon", () => movieApi.search({ status: "COMING_SOON", size: 100, sort: "title,asc" }));
  const movies = [...(nowShowing.data?.content ?? []), ...(comingSoon.data?.content ?? [])];

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [movieId, setMovieId] = useState(showtime ? String(showtime.movie.id) : "");
  const [roomId, setRoomId] = useState(String(showtime?.room.id ?? rooms.find((r) => r.status === "ACTIVE")?.id ?? rooms[0]?.id ?? ""));
  const [date, setDate] = useState(showtime ? toIsoDate(new Date(showtime.startTime)) : today);
  const [time, setTime] = useState(showtime ? instantToVietnamTime(showtime.startTime) : "19:00");
  const [toDate, setToDate] = useState(addDays(today, 6));
  const [times, setTimes] = useState<string[]>(["10:00", "14:00", "19:00"]);
  const [newTime, setNewTime] = useState("21:30");
  const [format, setFormat] = useState<RoomType | "">(showtime?.format ?? "");
  const [audioType, setAudioType] = useState<AudioType>(showtime?.audioType ?? "SUBTITLED");
  const [basePrice, setBasePrice] = useState(String(showtime?.basePrice ?? 90000));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [conflicts, setConflicts] = useState<ShowtimeConflict[]>([]);
  const [saving, setSaving] = useState(false);

  const room = rooms.find((r) => String(r.id) === roomId);
  const formats: RoomType[] = room ? [...new Set<RoomType>(["2D", room.roomType])] : ["2D"];

  async function submit(event: FormEvent) {
    event.preventDefault();
    const price = Number(basePrice);
    const found = {
      movieId: movieId ? undefined : t.admin.validation.required,
      roomId: roomId ? undefined : t.admin.validation.required,
      basePrice: basePrice.trim() !== "" && price >= 0 && price <= 10_000_000 ? undefined : t.admin.validation.range(0, 10_000_000),
      times: mode === "bulk" && times.length === 0 ? t.admin.showtimes.timesRequired : undefined,
      toDate: mode === "bulk" && toDate < date ? t.admin.validation.endBeforeStart : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    setFormError(null);
    setConflicts([]);
    const common = {
      movieId: Number(movieId),
      roomId: Number(roomId),
      format: format || undefined,
      audioType,
      basePrice: price,
    };
    try {
      if (showtime) await showtimeApi.update(showtime.id, { ...common, startTime: vietnamToInstant(date, time) });
      else if (mode === "single") await showtimeApi.create(cinemaId, { ...common, startTime: vietnamToInstant(date, time) });
      else {
        const created = await showtimeApi.createBulk(cinemaId, { ...common, fromDate: date, toDate, startTimes: [...times].sort() });
        toast.success(t.admin.showtimes.bulkCreated(created.length));
        return onSaved();
      }
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.code === "SHOWTIME_OVERLAP" && Array.isArray(error.details)) {
        setConflicts(error.details as ShowtimeConflict[]);
      }
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={showtime ? t.admin.showtimes.edit : t.admin.showtimes.add}
      description={t.admin.showtimes.formHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="showtime-form" size="md" loading={saving}>
            {showtime ? t.common.save : t.common.create}
          </Button>
        </>
      }
    >
      <form id="showtime-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {!showtime && (
          <div className="sm:col-span-2">
            <Segmented
              label={t.admin.showtimes.mode}
              value={mode}
              onChange={setMode}
              items={[
                { value: "single", label: t.admin.showtimes.single },
                { value: "bulk", label: t.admin.showtimes.bulk },
              ]}
            />
          </div>
        )}
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">
              {getErrorMessage(formError, t)}
              {conflicts.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {conflicts.map((c) => (
                    <li key={`${c.conflictingShowtimeId}-${c.startTime}`}>
                      {formatDateTime(c.startTime, intlLocale)} → #{c.conflictingShowtimeId}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          </div>
        )}

        <div className="sm:col-span-2">
          <SelectField label={t.admin.showtimes.movie} required size="md" value={movieId} onChange={(e) => setMovieId(e.target.value)} error={errors.movieId}>
            <option value="">{t.admin.showtimes.pickMovie}</option>
            {showtime && !movies.some((m) => m.id === showtime.movie.id) && <option value={showtime.movie.id}>{showtime.movie.title}</option>}
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} · {t.common.minutes(m.durationMinutes)} · {t.movie.status[m.status]}
              </option>
            ))}
          </SelectField>
        </div>
        <SelectField
          label={t.admin.showtimes.room}
          required
          size="md"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setFormat("");
          }}
          error={errors.roomId}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id} disabled={r.status !== "ACTIVE"}>
              {r.name} ({r.roomType}){r.status !== "ACTIVE" ? ` – ${t.admin.rooms.status.MAINTENANCE}` : ""}
            </option>
          ))}
        </SelectField>
        <SelectField label={t.showtime.format} size="md" value={format} onChange={(e) => setFormat(e.target.value as RoomType | "")}>
          <option value="">{t.admin.showtimes.roomFormat(room?.roomType ?? "2D")}</option>
          {formats.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </SelectField>

        <TextField label={mode === "bulk" ? t.admin.showtimes.from : t.admin.showtimes.date} required size="md" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        {mode === "single" || showtime ? (
          <TextField label={t.admin.showtimes.startTime} required size="md" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        ) : (
          <TextField label={t.admin.showtimes.to} required size="md" type="date" min={date} max={addDays(date, 30)} value={toDate} onChange={(e) => setToDate(e.target.value)} error={errors.toDate} />
        )}

        {mode === "bulk" && !showtime && (
          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">{t.admin.showtimes.startTimes}</legend>
            <div className="flex flex-wrap items-center gap-2">
              {[...times].sort().map((value) => (
                <span key={value} className="inline-flex items-center gap-1 rounded-full bg-primary py-1 pr-1 pl-3 text-sm font-bold text-black">
                  {value}
                  <button
                    type="button"
                    aria-label={t.common.deleteItem(value)}
                    onClick={() => setTimes((list) => list.filter((x) => x !== value))}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-black/10"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </span>
              ))}
              <input
                type="time"
                aria-label={t.admin.showtimes.newTime}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="h-9 rounded border border-line-strong bg-surface-2 px-2 text-sm text-fg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => newTime && !times.includes(newTime) && times.length < 12 && setTimes((list) => [...list, newTime])}
              >
                <Plus aria-hidden className="size-3.5" />
                {t.admin.showtimes.addTime}
              </Button>
            </div>
            {errors.times && <p className="text-xs font-medium text-danger">{errors.times}</p>}
            <p className="text-xs font-medium text-fg-muted">{t.admin.showtimes.bulkHint}</p>
          </fieldset>
        )}

        <SelectField label={t.admin.showtimes.audio} size="md" value={audioType} onChange={(e) => setAudioType(e.target.value as AudioType)}>
          {AUDIO_TYPES.map((a) => (
            <option key={a} value={a}>
              {t.showtime.audio[a]}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t.admin.showtimes.basePrice}
          required
          size="md"
          type="number"
          min={0}
          step={5000}
          value={basePrice}
          disabled={priceLocked}
          onChange={(e) => setBasePrice(e.target.value)}
          error={errors.basePrice}
          hint={priceLocked ? t.admin.showtimes.priceLocked : t.admin.showtimes.priceHint}
        />
      </form>
    </Dialog>
  );
}
