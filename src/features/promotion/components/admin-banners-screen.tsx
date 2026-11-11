"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Film, ImageIcon, Link2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CoverImage } from "@/components/ui/cover-image";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { controlClasses } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { adminChecks, anyError, backendFieldErrors, optional, type Errors } from "@/features/admin/form-utils";
import { ImageUploadField } from "@/features/media/components/image-upload-field";
import { isUploadedImage } from "@/features/media/image-file";
import { movieApi } from "@/features/movie/api";
import { bannerApi } from "@/features/promotion/api";
import {
  BANNER_STATES,
  type Banner,
  type BannerFilter,
  type BannerLinkType,
  type BannerRequest,
  type BannerState,
} from "@/features/promotion/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { addDays, formatDateTime, instantToVietnamTime, toIsoDate, todayInVietnam, vietnamToInstant } from "@/lib/format";

/** Backend BannerRequest patterns. */
const HTTPS_URL = /^https:\/\/\S+$/;

/** Same rule as the backend's @HttpsImageUrl: https, or an image uploaded to our storage (http in dev). */
function isBannerImage(url: string): boolean {
  return HTTPS_URL.test(url) || isUploadedImage(url);
}
const LINK_URL = /^(\/(?!\/)\S*|https?:\/\/\S+)$/;

const BANNER_STATE_TONES: Record<BannerState, BadgeTone> = {
  SHOWING: "success",
  UPCOMING: "info",
  ENDED: "neutral",
  INACTIVE: "danger",
};

/**
 * Home page banners (PRO-03). The home page shows the active banners whose schedule covers now, in this order; ↑/↓
 * reorder the full list, so they are only offered without a filter.
 */
export function AdminBannersScreen() {
  const t = useT();
  const { intlLocale } = useLocale();
  const toast = useToast();
  const [state, setState] = useState<BannerState | "ALL">("ALL");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const filter: BannerFilter = { state: state === "ALL" ? undefined : state, keyword: keyword || undefined };
  const banners = useApi(`banners:${JSON.stringify(filter)}`, () => bannerApi.list(filter));
  const canReorder = state === "ALL" && !keyword;
  const list = banners.data ?? [];

  function search(event: FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  async function move(index: number, delta: -1 | 1) {
    const ids = list.map((banner) => banner.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setReordering(true);
    try {
      const reordered = await bannerApi.reorder(ids);
      banners.setData(() => reordered);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
      banners.reload();
    } finally {
      setReordering(false);
    }
  }

  async function toggleStatus(banner: Banner) {
    setBusyId(banner.id);
    try {
      const hidden = banner.status === "ACTIVE";
      await bannerApi.changeStatus(banner.id, hidden ? "INACTIVE" : "ACTIVE");
      toast.success(hidden ? t.admin.banners.hidden : t.admin.banners.shown);
      banners.reload();
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
      await bannerApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      banners.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.banners.subtitle}</p>
        <Button size="md" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" />
          {t.admin.banners.add}
        </Button>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="overflow-x-auto">
            <Segmented
              label={t.admin.common.status}
              value={state}
              onChange={setState}
              items={[
                { value: "ALL", label: t.admin.banners.allStates },
                ...BANNER_STATES.map((value) => ({ value, label: t.admin.banners.state[value] })),
              ]}
            />
          </div>
          <form onSubmit={search} role="search" aria-label={t.admin.banners.keyword} className="flex items-end gap-2">
            <label className="flex min-w-56 flex-col gap-1 text-xs font-semibold text-fg-muted">
              {t.admin.banners.keyword}
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder={t.admin.banners.keywordPlaceholder}
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
        {!canReorder && list.length > 1 && <p className="text-xs font-medium text-fg-muted">{t.admin.banners.reorderHint}</p>}

        {banners.error && !banners.data ? (
          <ErrorState error={banners.error} onRetry={banners.reload} />
        ) : banners.data && list.length === 0 ? (
          <EmptyState icon={ImageIcon} title={t.admin.banners.empty} />
        ) : (
          <Table className="min-w-[960px]">
            <thead>
              <tr>
                <Th className="w-24">{t.admin.banners.order}</Th>
                <Th>{t.admin.banners.banner}</Th>
                <Th>{t.admin.banners.link}</Th>
                <Th>{t.admin.banners.period}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!banners.data ? (
              <TableSkeleton columns={6} />
            ) : (
              <tbody>
                {list.map((banner, index) => (
                  <tr key={banner.id}>
                    <Td>
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-center text-sm font-bold text-fg tabular-nums">{index + 1}</span>
                        {canReorder && (
                          <>
                            <IconButton
                              label={t.admin.banners.moveUp(banner.title)}
                              onClick={() => move(index, -1)}
                              disabled={index === 0 || reordering}
                              className="size-7"
                            >
                              <ArrowUp aria-hidden className="size-4" />
                            </IconButton>
                            <IconButton
                              label={t.admin.banners.moveDown(banner.title)}
                              onClick={() => move(index, 1)}
                              disabled={index === list.length - 1 || reordering}
                              className="size-7"
                            >
                              <ArrowDown aria-hidden className="size-4" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[8/3] w-32 shrink-0 overflow-hidden rounded border border-line">
                          <CoverImage src={banner.imageUrl} alt="" sizes="128px" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 max-w-64 font-semibold text-fg">{banner.title}</p>
                          {banner.subtitle && <p className="line-clamp-1 max-w-64 text-xs text-fg-muted">{banner.subtitle}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <BannerLink banner={banner} />
                    </Td>
                    <Td className="text-xs whitespace-nowrap text-fg-2">
                      <p>{formatDateTime(banner.startAt, intlLocale)}</p>
                      <p className="text-fg-muted">→ {formatDateTime(banner.endAt, intlLocale)}</p>
                    </Td>
                    <Td>
                      <Badge tone={BANNER_STATE_TONES[banner.state]}>{t.admin.banners.state[banner.state]}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={t.common.editItem(banner.title)} onClick={() => setEditing(banner)}>
                          <Pencil aria-hidden className="size-4" />
                        </IconButton>
                        <IconButton
                          label={
                            banner.status === "ACTIVE" ? t.admin.banners.hide(banner.title) : t.admin.banners.show(banner.title)
                          }
                          onClick={() => toggleStatus(banner)}
                          disabled={busyId === banner.id}
                        >
                          {banner.status === "ACTIVE" ? (
                            <EyeOff aria-hidden className="size-4" />
                          ) : (
                            <Eye aria-hidden className="size-4" />
                          )}
                        </IconButton>
                        <IconButton label={t.common.deleteItem(banner.title)} tone="danger" onClick={() => setToDelete(banner)}>
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
        {banners.data && list.length > 0 && (
          <p className="text-xs font-semibold text-fg-muted">{t.admin.banners.total(list.length)}</p>
        )}
      </Card>

      {editing !== null && (
        <BannerDialog
          banner={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            banners.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={toDelete !== null && busyId === toDelete.id}
        title={t.admin.banners.deleteTitle}
        description={toDelete ? t.admin.banners.deleteText(toDelete.title) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

function BannerLink({ banner }: { banner: Banner }) {
  const t = useT();
  if (banner.linkType === "MOVIE" && banner.movie) {
    return (
      <p className="flex max-w-56 items-center gap-1.5 text-sm font-medium text-fg-2">
        <Film aria-hidden className="size-3.5 shrink-0" />
        <span className="line-clamp-1">{banner.movie.title}</span>
      </p>
    );
  }
  if (banner.linkType === "URL" && banner.linkUrl) {
    return (
      <p className="flex max-w-56 items-center gap-1.5 text-sm font-medium text-fg-2">
        <Link2 aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate font-mono text-xs">{banner.linkUrl}</span>
      </p>
    );
  }
  return <p className="text-sm text-fg-muted">{t.admin.banners.linkNone}</p>;
}

type Field = "title" | "subtitle" | "imageUrl" | "movieId" | "linkUrl" | "startAt" | "endAt";

function BannerDialog({ banner, onClose, onSaved }: { banner?: Banner; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const check = adminChecks(t);
  const movies = useApi("banners:movies", () => movieApi.search({ size: 100, sort: "releaseDate,desc" }));
  const today = todayInVietnam();
  const [values, setValues] = useState({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    imageUrl: banner?.imageUrl ?? "",
    movieId: String(banner?.movie?.id ?? ""),
    linkUrl: banner?.linkUrl ?? "",
    startDate: banner ? toIsoDate(new Date(banner.startAt)) : today,
    startTime: banner ? instantToVietnamTime(banner.startAt) : "00:00",
    endDate: banner ? toIsoDate(new Date(banner.endAt)) : addDays(today, 14),
    endTime: banner ? instantToVietnamTime(banner.endAt) : "00:00",
  });
  const [linkType, setLinkType] = useState<BannerLinkType>(banner?.linkType ?? "NONE");
  const [active, setActive] = useState(banner ? banner.status === "ACTIVE" : true);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: event.target.value }));

  const startAt = values.startDate && values.startTime ? vietnamToInstant(values.startDate, values.startTime) : "";
  const endAt = values.endDate && values.endTime ? vietnamToInstant(values.endDate, values.endTime) : "";
  const imageUrl = values.imageUrl.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: Errors<Field> = {
      title: check.required(values.title) ?? check.maxLength(values.title, 120),
      subtitle: check.maxLength(values.subtitle, 255),
      imageUrl:
        check.required(imageUrl) ??
        check.maxLength(imageUrl, 500) ??
        (isBannerImage(imageUrl) ? undefined : t.admin.banners.imageHttps),
      movieId: linkType === "MOVIE" && !values.movieId ? t.admin.banners.movieRequired : undefined,
      linkUrl:
        linkType === "URL"
          ? (check.required(values.linkUrl) ??
            check.maxLength(values.linkUrl, 500) ??
            (LINK_URL.test(values.linkUrl.trim()) ? undefined : t.admin.banners.linkUrlHint))
          : undefined,
      startAt: startAt ? undefined : t.admin.validation.required,
      endAt: !endAt ? t.admin.validation.required : startAt && endAt <= startAt ? t.admin.validation.endBeforeStart : undefined,
    };
    setErrors(found);
    if (anyError(found)) return;
    setSaving(true);
    setFormError(null);
    const body: BannerRequest = {
      title: values.title.trim(),
      subtitle: optional(values.subtitle),
      imageUrl,
      linkType,
      movieId: linkType === "MOVIE" ? Number(values.movieId) : undefined,
      linkUrl: linkType === "URL" ? values.linkUrl.trim() : undefined,
      startAt,
      endAt,
      status: active ? "ACTIVE" : "INACTIVE",
    };
    try {
      if (banner) await bannerApi.update(banner.id, body);
      else await bannerApi.create(body);
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
  const currentMovieMissing = banner?.movie && !movieOptions.some((movie) => movie.id === banner.movie?.id);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={banner ? t.admin.banners.edit : t.admin.banners.add}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="banner-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="banner-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">{getErrorMessage(formError, t)}</Alert>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="relative aspect-[8/3] w-full overflow-hidden rounded-lg border border-line bg-black">
            <CoverImage src={isBannerImage(imageUrl) ? imageUrl : null} alt={t.admin.banners.imagePreview} sizes="640px" />
            {values.title.trim() && (
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/20 to-transparent p-4 text-white">
                <p className="line-clamp-1 text-lg font-bold">{values.title}</p>
                {values.subtitle.trim() && <p className="line-clamp-1 text-sm text-neutral-200">{values.subtitle}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <ImageUploadField
            purpose="BANNER"
            label={t.admin.banners.imageUrl}
            required
            value={values.imageUrl}
            onChange={(url) => setValues((v) => ({ ...v, imageUrl: url }))}
            hint={t.admin.banners.imageHint}
            error={errors.imageUrl}
          />
        </div>
        <TextField
          label={t.admin.banners.title}
          required
          value={values.title}
          maxLength={120}
          onChange={set("title")}
          error={errors.title}
        />
        <TextField
          label={t.admin.banners.subtitleField}
          optional
          value={values.subtitle}
          maxLength={255}
          onChange={set("subtitle")}
          error={errors.subtitle}
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-semibold text-fg-2">{t.admin.banners.link}</span>
          <Segmented
            label={t.admin.banners.link}
            value={linkType}
            onChange={setLinkType}
            items={[
              { value: "NONE", label: t.admin.banners.linkType.NONE },
              { value: "MOVIE", label: t.admin.banners.linkType.MOVIE },
              { value: "URL", label: t.admin.banners.linkType.URL },
            ]}
          />
        </div>
        {linkType === "MOVIE" && (
          <div className="sm:col-span-2">
            <SelectField
              label={t.admin.banners.movie}
              required
              value={values.movieId}
              onChange={set("movieId")}
              error={errors.movieId}
            >
              <option value="">{t.admin.banners.pickMovie}</option>
              {movieOptions.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
              {currentMovieMissing && banner?.movie && <option value={banner.movie.id}>{banner.movie.title}</option>}
            </SelectField>
          </div>
        )}
        {linkType === "URL" && (
          <div className="sm:col-span-2">
            <TextField
              label={t.admin.banners.linkUrl}
              required
              value={values.linkUrl}
              maxLength={500}
              onChange={set("linkUrl")}
              placeholder="/movies"
              hint={t.admin.banners.linkUrlHint}
              error={errors.linkUrl}
            />
          </div>
        )}

        <TextField
          label={t.admin.vouchers.startDate}
          type="date"
          required
          value={values.startDate}
          onChange={set("startDate")}
          error={errors.startAt}
        />
        <TextField label={t.admin.vouchers.startTime} type="time" required value={values.startTime} onChange={set("startTime")} />
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

        <Checkbox
          className="sm:col-span-2"
          label={t.admin.banners.active}
          description={t.admin.banners.activeHint}
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
      </form>
    </Dialog>
  );
}
