"use client";

import { Building2, Globe, Pause, Pencil, Play, Plus, Search, TicketPercent, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { adminChecks, anyError, backendFieldErrors, optional, type Errors } from "@/features/admin/form-utils";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import type { Cinema } from "@/features/cinema/types";
import { movieApi } from "@/features/movie/api";
import { voucherApi } from "@/features/promotion/api";
import { describeDiscount } from "@/features/promotion/discount";
import {
  VOUCHER_STATES,
  type DiscountType,
  type Voucher,
  type VoucherFilter,
  type VoucherRequest,
  type VoucherState,
} from "@/features/promotion/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import {
  addDays,
  formatDateTime,
  formatVnd,
  instantToVietnamTime,
  toIsoDate,
  todayInVietnam,
  vietnamToInstant,
} from "@/lib/format";

const PAGE_SIZE = 20;
/** Backend VoucherRequest limits. */
const MAX_AMOUNT = 10_000_000;
const MAX_MIN_ORDER = 1_000_000_000;
const MAX_USAGE = 1_000_000;
const MAX_PER_USER = 100;
const CODE_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;

export const VOUCHER_STATE_TONES: Record<VoucherState, BadgeTone> = {
  RUNNING: "success",
  UPCOMING: "info",
  USED_UP: "warning",
  ENDED: "neutral",
  INACTIVE: "danger",
};

/** "" = every voucher the user may manage, "global" = system-wide only, "cinema" = the topbar cinema's. */
type Scope = "" | "global" | "cinema";

/**
 * Vouchers (PRO-01). Staff with VOUCHER_MANAGE_GLOBAL see and create every voucher (system-wide or for any cinema);
 * cinema managers (VOUCHER_MANAGE_CINEMA) work on the cinema picked in the topbar.
 */
export function AdminVouchersScreen() {
  const t = useT();
  const { user } = useSession();
  const { selected: cinema, cinemas, loading } = useAdminCinema();
  const canGlobal = hasAny(user, ["VOUCHER_MANAGE_GLOBAL"]);
  if (!canGlobal && loading && !cinema) return <LoadingState />;
  if (!canGlobal && !cinema) return <EmptyState icon={Building2} title={t.admin.noCinema} description={t.admin.noCinemaHint} />;
  return <Vouchers key={canGlobal ? "global" : cinema?.id} canGlobal={canGlobal} cinema={cinema} cinemas={cinemas} />;
}

function Vouchers({ canGlobal, cinema, cinemas }: { canGlobal: boolean; cinema: Cinema | null; cinemas: Cinema[] }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const [state, setState] = useState<VoucherState | "ALL">("ALL");
  const [scope, setScope] = useState<Scope>(canGlobal ? "" : "cinema");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Voucher | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filter: VoucherFilter = {
    state: state === "ALL" ? undefined : state,
    keyword: keyword || undefined,
    globalOnly: scope === "global" || undefined,
    cinemaId: scope === "cinema" ? cinema?.id : undefined,
    page,
    size: PAGE_SIZE,
  };
  const vouchers = useApi(`vouchers:${JSON.stringify(filter)}`, () => voucherApi.list(filter));

  function search(event: FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(0);
  }

  async function toggleStatus(voucher: Voucher) {
    setBusyId(voucher.id);
    try {
      const paused = voucher.status === "ACTIVE";
      await voucherApi.changeStatus(voucher.id, paused ? "INACTIVE" : "ACTIVE");
      toast.success(paused ? t.admin.vouchers.paused : t.admin.vouchers.resumed);
      vouchers.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await voucherApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      vouchers.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusyId(null);
    }
  }

  const content = vouchers.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-fg-muted">
          {!canGlobal && cinema && (
            <>
              <Building2 aria-hidden className="size-4" />
              <span className="font-semibold text-fg">{cinema.name}</span>·
            </>
          )}
          {t.admin.vouchers.subtitle}
        </p>
        <Button size="md" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" />
          {t.admin.vouchers.add}
        </Button>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="overflow-x-auto">
          <Segmented
            label={t.admin.common.status}
            value={state}
            onChange={(value) => {
              setState(value);
              setPage(0);
            }}
            items={[
              { value: "ALL", label: t.admin.vouchers.allStates },
              ...VOUCHER_STATES.map((value) => ({ value, label: t.admin.vouchers.state[value] })),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {canGlobal && (
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.vouchers.scope}
              <Select
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value as Scope);
                  setPage(0);
                }}
                className="min-w-52"
              >
                <option value="">{t.admin.vouchers.allScopes}</option>
                <option value="global">{t.admin.vouchers.global}</option>
                {cinema && <option value="cinema">{cinema.name}</option>}
              </Select>
            </label>
          )}
          <form onSubmit={search} role="search" aria-label={t.admin.vouchers.keyword} className="flex flex-1 items-end gap-2">
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.vouchers.keyword}
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder={t.admin.vouchers.keywordPlaceholder}
                maxLength={100}
                className={controlClasses({ size: "md" })}
              />
            </label>
            <Button type="submit" size="md" variant="outline" className="shrink-0">
              <Search aria-hidden className="size-4" />
              {t.admin.vouchers.search}
            </Button>
          </form>
        </div>

        {vouchers.error && !vouchers.data ? (
          <ErrorState error={vouchers.error} onRetry={vouchers.reload} />
        ) : vouchers.data && content.length === 0 ? (
          <EmptyState icon={TicketPercent} title={t.admin.vouchers.empty} />
        ) : (
          <Table className="min-w-[960px]">
            <thead>
              <tr>
                <Th>{t.admin.vouchers.code}</Th>
                <Th>{t.admin.vouchers.discount}</Th>
                <Th>{t.admin.vouchers.scope}</Th>
                <Th>{t.admin.vouchers.period}</Th>
                <Th>{t.admin.vouchers.used}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!vouchers.data ? (
              <TableSkeleton columns={7} />
            ) : (
              <tbody>
                {content.map((voucher) => (
                  <tr key={voucher.id}>
                    <Td>
                      <p className="font-mono font-bold text-fg">{voucher.code}</p>
                      <p className="line-clamp-1 max-w-56 text-xs text-fg-muted">{voucher.name}</p>
                    </Td>
                    <Td>
                      <p className="font-semibold text-fg">{describeDiscount(voucher, t, intlLocale)}</p>
                      {Number(voucher.minOrderValue) > 0 && (
                        <p className="text-xs text-fg-muted">
                          {t.promotion.minOrder(formatVnd(voucher.minOrderValue, intlLocale))}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <p className="flex items-center gap-1.5 font-medium text-fg-2">
                        {voucher.cinema ? (
                          <Building2 aria-hidden className="size-3.5 shrink-0" />
                        ) : (
                          <Globe aria-hidden className="size-3.5 shrink-0" />
                        )}
                        {voucher.cinema?.name ?? t.admin.vouchers.global}
                      </p>
                      <p className="line-clamp-1 max-w-48 text-xs text-fg-muted">
                        {voucher.movie?.name ?? t.admin.vouchers.allMovies}
                      </p>
                    </Td>
                    <Td className="text-xs whitespace-nowrap text-fg-2">
                      <p>{formatDateTime(voucher.startAt, intlLocale)}</p>
                      <p className="text-fg-muted">→ {formatDateTime(voucher.endAt, intlLocale)}</p>
                    </Td>
                    <Td>
                      <Usage voucher={voucher} />
                    </Td>
                    <Td>
                      <Badge tone={VOUCHER_STATE_TONES[voucher.state]}>{t.admin.vouchers.state[voucher.state]}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={t.common.editItem(voucher.code)} onClick={() => setEditing(voucher)}>
                          <Pencil aria-hidden className="size-4" />
                        </IconButton>
                        <IconButton
                          label={
                            voucher.status === "ACTIVE"
                              ? t.admin.vouchers.pause(voucher.code)
                              : t.admin.vouchers.resume(voucher.code)
                          }
                          onClick={() => toggleStatus(voucher)}
                          disabled={busyId === voucher.id}
                        >
                          {voucher.status === "ACTIVE" ? (
                            <Pause aria-hidden className="size-4" />
                          ) : (
                            <Play aria-hidden className="size-4" />
                          )}
                        </IconButton>
                        {voucher.usedCount === 0 && (
                          <IconButton
                            label={t.common.deleteItem(voucher.code)}
                            tone="danger"
                            onClick={() => setToDelete(voucher)}
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </IconButton>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
        {vouchers.data && vouchers.data.totalElements > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-fg-muted">{t.admin.vouchers.total(vouchers.data.totalElements)}</p>
            <Pagination page={vouchers.data.page} totalPages={vouchers.data.totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      {editing !== null && (
        <VoucherDialog
          voucher={editing === "new" ? undefined : editing}
          canGlobal={canGlobal}
          cinema={cinema}
          cinemas={cinemas}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            vouchers.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={toDelete !== null && busyId === toDelete.id}
        title={t.admin.vouchers.deleteTitle}
        description={toDelete ? t.admin.vouchers.deleteText(toDelete.code) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

/** Uses so far against the limit, with a bar when there is one. */
function Usage({ voucher }: { voucher: Voucher }) {
  const t = useT();
  const limit = voucher.usageLimit;
  const percent = limit ? Math.min(100, Math.round((voucher.usedCount / limit) * 100)) : 0;
  return (
    <div className="flex w-28 flex-col gap-1">
      <p className="text-sm font-semibold text-fg tabular-nums">
        {voucher.usedCount}/{limit ?? "∞"}
      </p>
      {limit !== null && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={voucher.usedCount}
          aria-label={t.admin.vouchers.used}
        >
          <div
            className={`h-full rounded-full ${percent >= 100 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {voucher.perUserLimit !== null && <p className="text-xs text-fg-muted">{t.admin.vouchers.perUser(voucher.perUserLimit)}</p>}
    </div>
  );
}

type Field =
  | "code"
  | "name"
  | "description"
  | "discountValue"
  | "maxDiscount"
  | "minOrderValue"
  | "usageLimit"
  | "perUserLimit"
  | "startAt"
  | "endAt";

const number = (value: number | null | undefined) => (value == null ? "" : String(Number(value)));

function VoucherDialog({
  voucher,
  canGlobal,
  cinema,
  cinemas,
  onClose,
  onSaved,
}: {
  voucher?: Voucher;
  canGlobal: boolean;
  cinema: Cinema | null;
  cinemas: Cinema[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const check = adminChecks(t);
  const movies = useApi("vouchers:movies", () => movieApi.search({ size: 100, sort: "releaseDate,desc" }));
  const locked = (voucher?.usedCount ?? 0) > 0;
  const today = todayInVietnam();
  const [values, setValues] = useState({
    code: voucher?.code ?? "",
    name: voucher?.name ?? "",
    description: voucher?.description ?? "",
    discountValue: number(voucher?.discountValue),
    maxDiscount: number(voucher?.maxDiscount),
    minOrderValue: voucher && Number(voucher.minOrderValue) > 0 ? number(voucher.minOrderValue) : "",
    usageLimit: number(voucher?.usageLimit),
    perUserLimit: voucher ? number(voucher.perUserLimit) : "1",
    // A cinema manager's vouchers always belong to the topbar cinema
    cinemaId: voucher ? String(voucher.cinema?.id ?? "") : canGlobal ? "" : String(cinema?.id ?? ""),
    movieId: String(voucher?.movie?.id ?? ""),
    startDate: voucher ? toIsoDate(new Date(voucher.startAt)) : today,
    startTime: voucher ? instantToVietnamTime(voucher.startAt) : "00:00",
    endDate: voucher ? toIsoDate(new Date(voucher.endAt)) : addDays(today, 30),
    endTime: voucher ? instantToVietnamTime(voucher.endAt) : "00:00",
  });
  const [type, setType] = useState<DiscountType>(voucher?.discountType ?? "PERCENT");
  const [active, setActive] = useState(voucher ? voucher.status === "ACTIVE" : true);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: field === "code" ? event.target.value.toUpperCase() : event.target.value }));
  const optionalInt = (value: string, min: number, max: number) => (value.trim() ? check.intRange(value, min, max) : undefined);

  const startAt = values.startDate && values.startTime ? vietnamToInstant(values.startDate, values.startTime) : "";
  const endAt = values.endDate && values.endTime ? vietnamToInstant(values.endDate, values.endTime) : "";
  const previewValue = Number(values.discountValue);
  const preview =
    values.discountValue.trim() && Number.isFinite(previewValue) && previewValue > 0
      ? [
          describeDiscount(
            {
              discountType: type,
              discountValue: previewValue,
              maxDiscount: type === "PERCENT" && values.maxDiscount ? Number(values.maxDiscount) : null,
            },
            t,
            intlLocale,
          ),
          values.minOrderValue.trim() && Number(values.minOrderValue) > 0
            ? t.promotion.minOrder(formatVnd(Number(values.minOrderValue), intlLocale))
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const used = voucher?.usedCount ?? 0;
    const found: Errors<Field> = {
      code: check.required(values.code) ?? (CODE_PATTERN.test(values.code.trim()) ? undefined : t.admin.vouchers.codeHint),
      name: check.required(values.name) ?? check.maxLength(values.name, 255),
      description: check.maxLength(values.description, 1000),
      discountValue:
        type === "PERCENT"
          ? check.intRange(values.discountValue, 1, 100) && t.admin.vouchers.percentMax
          : check.intRange(values.discountValue, 1, MAX_AMOUNT),
      maxDiscount: type === "PERCENT" ? optionalInt(values.maxDiscount, 1, MAX_AMOUNT) : undefined,
      minOrderValue: optionalInt(values.minOrderValue, 0, MAX_MIN_ORDER),
      usageLimit:
        optionalInt(values.usageLimit, 1, MAX_USAGE) ??
        (values.usageLimit.trim() && Number(values.usageLimit) < used ? t.admin.vouchers.usageBelowUsed(used) : undefined),
      perUserLimit: optionalInt(values.perUserLimit, 1, MAX_PER_USER),
      startAt: startAt ? undefined : t.admin.validation.required,
      endAt: !endAt ? t.admin.validation.required : startAt && endAt <= startAt ? t.admin.validation.endBeforeStart : undefined,
    };
    setErrors(found);
    if (anyError(found)) return;
    setSaving(true);
    setFormError(null);
    const body: VoucherRequest = {
      code: values.code.trim(),
      name: values.name.trim(),
      description: optional(values.description),
      discountType: type,
      discountValue: Number(values.discountValue),
      maxDiscount: type === "PERCENT" && values.maxDiscount.trim() ? Number(values.maxDiscount) : undefined,
      minOrderValue: values.minOrderValue.trim() ? Number(values.minOrderValue) : undefined,
      usageLimit: values.usageLimit.trim() ? Number(values.usageLimit) : undefined,
      perUserLimit: values.perUserLimit.trim() ? Number(values.perUserLimit) : undefined,
      cinemaId: values.cinemaId ? Number(values.cinemaId) : undefined,
      movieId: values.movieId ? Number(values.movieId) : undefined,
      startAt,
      endAt,
      status: active ? "ACTIVE" : "INACTIVE",
    };
    try {
      if (voucher) await voucherApi.update(voucher.id, body);
      else await voucherApi.create(body);
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (error) {
      const fieldErrors = backendFieldErrors<Field>(error, t);
      if (anyError(fieldErrors)) setErrors(fieldErrors);
      else setFormError(error);
      setSaving(false);
    }
  }

  const movieOptions = movies.data?.content ?? [];
  const lockedMovieMissing = voucher?.movie && !movieOptions.some((movie) => movie.id === voucher.movie?.id);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={voucher ? t.admin.vouchers.edit : t.admin.vouchers.add}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="voucher-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="voucher-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">{getErrorMessage(formError, t)}</Alert>
          </div>
        )}
        {locked && voucher && (
          <div className="sm:col-span-2">
            <Alert tone="info">{t.admin.vouchers.lockedHint(voucher.usedCount)}</Alert>
          </div>
        )}
        <TextField
          label={t.admin.vouchers.code}
          required
          autoFocus={!voucher}
          disabled={locked}
          value={values.code}
          maxLength={30}
          onChange={set("code")}
          hint={t.admin.vouchers.codeHint}
          error={errors.code}
          className="font-mono"
        />
        <TextField
          label={t.admin.vouchers.name}
          required
          value={values.name}
          maxLength={255}
          onChange={set("name")}
          error={errors.name}
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-semibold text-fg-2">{t.admin.vouchers.type}</span>
          <fieldset disabled={locked} className="disabled:opacity-60">
            <Segmented
              label={t.admin.vouchers.type}
              value={type}
              onChange={setType}
              items={[
                { value: "PERCENT", label: t.admin.vouchers.typePercent },
                { value: "FIXED", label: t.admin.vouchers.typeFixed },
              ]}
            />
          </fieldset>
        </div>
        <TextField
          label={type === "PERCENT" ? t.admin.vouchers.percentValue : t.admin.vouchers.fixedValue}
          required
          disabled={locked}
          inputMode="numeric"
          value={values.discountValue}
          onChange={set("discountValue")}
          error={errors.discountValue}
        />
        {type === "PERCENT" ? (
          <TextField
            label={t.admin.vouchers.maxDiscount}
            optional
            disabled={locked}
            inputMode="numeric"
            value={values.maxDiscount}
            onChange={set("maxDiscount")}
            hint={t.admin.vouchers.unlimitedHint}
            error={errors.maxDiscount}
          />
        ) : (
          <div aria-hidden className="hidden sm:block" />
        )}
        <TextField
          label={t.admin.vouchers.minOrderValue}
          optional
          disabled={locked}
          inputMode="numeric"
          value={values.minOrderValue}
          onChange={set("minOrderValue")}
          error={errors.minOrderValue}
        />
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label={t.admin.vouchers.usageLimit}
              optional
              inputMode="numeric"
              value={values.usageLimit}
              onChange={set("usageLimit")}
              error={errors.usageLimit}
            />
            <TextField
              label={t.admin.vouchers.perUserLimit}
              optional
              inputMode="numeric"
              value={values.perUserLimit}
              onChange={set("perUserLimit")}
              error={errors.perUserLimit}
            />
          </div>
          <p className="text-xs font-medium text-fg-muted">{t.admin.vouchers.unlimitedHint}</p>
        </div>

        {canGlobal ? (
          <SelectField label={t.admin.vouchers.cinema} value={values.cinemaId} onChange={set("cinemaId")} disabled={locked}>
            <option value="">{t.admin.vouchers.global}</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {voucher?.cinema && !cinemas.some((c) => c.id === voucher.cinema?.id) && (
              <option value={voucher.cinema.id}>{voucher.cinema.name}</option>
            )}
          </SelectField>
        ) : (
          <TextField label={t.admin.vouchers.cinema} value={voucher?.cinema?.name ?? cinema?.name ?? ""} disabled readOnly />
        )}
        <SelectField label={t.admin.vouchers.movie} value={values.movieId} onChange={set("movieId")} disabled={locked}>
          <option value="">{t.admin.vouchers.allMovies}</option>
          {movieOptions.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
          {lockedMovieMissing && voucher?.movie && <option value={voucher.movie.id}>{voucher.movie.name}</option>}
        </SelectField>

        {/* Date and time side by side per row: four columns do not fit the dialog */}
        <TextField
          label={t.admin.vouchers.startDate}
          type="date"
          required
          disabled={locked}
          value={values.startDate}
          onChange={set("startDate")}
          error={errors.startAt}
        />
        <TextField
          label={t.admin.vouchers.startTime}
          type="time"
          required
          disabled={locked}
          value={values.startTime}
          onChange={set("startTime")}
        />
        <TextField
          label={t.admin.vouchers.endDate}
          type="date"
          required
          min={values.startDate}
          value={values.endDate}
          onChange={set("endDate")}
          error={errors.endAt}
        />
        <TextField label={t.admin.vouchers.endTime} type="time" required value={values.endTime} onChange={set("endTime")} />

        <div className="sm:col-span-2">
          <TextareaField
            label={t.admin.vouchers.description}
            optional
            rows={2}
            value={values.description}
            onChange={set("description")}
            error={errors.description}
          />
        </div>
        <Checkbox
          className="sm:col-span-2"
          label={t.admin.vouchers.active}
          description={t.admin.vouchers.activeHint}
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        {preview && (
          <p className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-fg sm:col-span-2">
            <TicketPercent aria-hidden className="size-4 shrink-0 text-accent" />
            <span className="text-fg-muted">{t.admin.vouchers.preview}:</span>
            <span className="font-mono">{values.code || "—"}</span>· {preview}
          </p>
        )}
      </form>
    </Dialog>
  );
}
