"use client";

import { ArrowLeft, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { SelectField } from "@/components/ui/select-field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { adminChecks, anyError, backendFieldErrors, optional, type Errors } from "@/features/admin/form-utils";
import { cinemaApi } from "@/features/cinema/api";
import type { Cinema, CinemaRequest, CinemaStatus } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

type Field = "name" | "address" | "city" | "district" | "phone" | "latitude" | "longitude" | "imageUrl" | "status";
type Values = Record<Field, string>;

function toValues(c?: Cinema): Values {
  return {
    name: c?.name ?? "",
    address: c?.address ?? "",
    city: c?.city ?? "",
    district: c?.district ?? "",
    phone: c?.phone ?? "",
    latitude: c?.latitude?.toString() ?? "",
    longitude: c?.longitude?.toString() ?? "",
    imageUrl: c?.imageUrl ?? "",
    status: c?.status ?? "ACTIVE",
  };
}

export function AdminCinemaEditor({ cinemaId }: { cinemaId?: string }) {
  const cinema = useApi(cinemaId ? `admin-cinema:${cinemaId}` : null, () => cinemaApi.get(cinemaId!));
  // GET /cinemas/{id} is public and only returns ACTIVE cinemas → fall back to the managed list for closed ones.
  const { cinemas, loading } = useAdminCinema();
  const fromList = cinemaId ? cinemas.find((c) => c.id === Number(cinemaId)) : undefined;
  const data = cinema.data ?? fromList;

  if (cinemaId && !data) {
    if (cinema.loading || loading) return <LoadingState />;
    return <ErrorState error={cinema.error} onRetry={cinema.reload} />;
  }
  return <CinemaForm cinema={data} />;
}

function CinemaForm({ cinema }: { cinema?: Cinema }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const check = adminChecks(t);
  const { reload } = useAdminCinema();
  const [values, setValues] = useState<Values>(() => toValues(cinema));
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (field: Field) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  function validate(): Errors<Field> {
    const pairBroken = !!values.latitude.trim() !== !!values.longitude.trim();
    return {
      name: check.required(values.name) ?? check.maxLength(values.name, 255),
      address: check.required(values.address) ?? check.maxLength(values.address, 500),
      city: check.required(values.city) ?? check.maxLength(values.city, 100),
      district: check.maxLength(values.district, 100),
      phone: values.phone.trim() && !/^\+?[0-9 ().-]{8,20}$/.test(values.phone.trim()) ? t.validation.phoneInvalid : undefined,
      latitude: pairBroken ? t.admin.cinemas.coordsPair : values.latitude.trim() ? check.numberRange(values.latitude, -90, 90) : undefined,
      longitude: pairBroken ? t.admin.cinemas.coordsPair : values.longitude.trim() ? check.numberRange(values.longitude, -180, 180) : undefined,
      imageUrl: check.url(values.imageUrl),
    };
  }

  function fillMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((v) => ({ ...v, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (anyError(found)) return;
    const body: CinemaRequest = {
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      district: optional(values.district),
      phone: optional(values.phone),
      latitude: values.latitude.trim() ? Number(values.latitude) : undefined,
      longitude: values.longitude.trim() ? Number(values.longitude) : undefined,
      imageUrl: optional(values.imageUrl),
      status: values.status as CinemaStatus,
    };
    setSaving(true);
    try {
      if (cinema) await cinemaApi.update(cinema.id, body);
      else await cinemaApi.create(body);
      toast.success(t.admin.common.saved);
      reload();
      router.push(ROUTES.admin.cinemas);
    } catch (error) {
      setErrors(backendFieldErrors(error, t));
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.admin.cinemas} className={buttonClasses({ variant: "ghost", size: "md" })}>
          <ArrowLeft aria-hidden className="size-4" />
          {t.admin.cinemas.backToList}
        </Link>
        <Button type="submit" size="md" loading={saving}>
          {t.common.save}
        </Button>
      </div>
      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="flex flex-col gap-4 p-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-surface-3">
            <CoverImage src={values.imageUrl.trim() || null} alt={t.admin.cinemas.imagePreview} sizes="340px" />
          </div>
          <TextField
            label={t.admin.cinemas.imageUrl}
            optional
            size="md"
            type="url"
            placeholder="https://…"
            value={values.imageUrl}
            onChange={set("imageUrl")}
            error={errors.imageUrl}
          />
          <SelectField label={t.admin.common.status} value={values.status} onChange={set("status")} hint={t.admin.cinemas.statusHint}>
            <option value="ACTIVE">{t.cinema.statusLabel.ACTIVE}</option>
            <option value="INACTIVE">{t.cinema.statusLabel.INACTIVE}</option>
          </SelectField>
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField label={t.admin.cinemas.name} required value={values.name} onChange={set("name")} error={errors.name} />
          </div>
          <div className="md:col-span-2">
            <TextField label={t.admin.cinemas.address} required value={values.address} onChange={set("address")} error={errors.address} />
          </div>
          <TextField label={t.cinema.city} required value={values.city} onChange={set("city")} error={errors.city} />
          <TextField label={t.admin.cinemas.district} optional value={values.district} onChange={set("district")} error={errors.district} />
          <TextField label={t.admin.cinemas.phone} optional type="tel" value={values.phone} onChange={set("phone")} error={errors.phone} />
          <div className="hidden md:block" />
          <TextField
            label={t.admin.cinemas.latitude}
            optional
            inputMode="decimal"
            value={values.latitude}
            onChange={set("latitude")}
            error={errors.latitude}
          />
          <TextField
            label={t.admin.cinemas.longitude}
            optional
            inputMode="decimal"
            value={values.longitude}
            onChange={set("longitude")}
            error={errors.longitude}
          />
          <div className="md:col-span-2">
            <Button variant="outline" size="md" onClick={fillMyLocation} loading={locating}>
              <LocateFixed aria-hidden className="size-4" />
              {t.admin.cinemas.useLocation}
            </Button>
            <p className="mt-2 text-xs font-medium text-fg-muted">{t.admin.cinemas.coordsHint}</p>
          </div>
        </Card>
      </div>
    </form>
  );
}
