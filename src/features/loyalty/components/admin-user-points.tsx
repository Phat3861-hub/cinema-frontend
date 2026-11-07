"use client";

import { Coins, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { loyaltyApi } from "@/features/loyalty/api";
import { LoyaltyHistory } from "@/features/loyalty/components/loyalty-history";
import { formatPoints } from "@/features/loyalty/rules";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

const PAGE_SIZE = 10;
const MAX_ADJUST = 1_000_000;

/** Points tab of the admin user detail (USER_MANAGE): balance, manual adjustment (not on your own account) and history. */
export function AdminUserPoints({ userId, self }: { userId: number; self: boolean }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [page, setPage] = useState(0);
  const [adjusting, setAdjusting] = useState(false);
  const account = useApi(`user:${userId}:loyalty`, () => loyaltyApi.balanceOf(userId));
  const history = useApi(`user:${userId}:loyalty:${page}`, () => loyaltyApi.historyOf(userId, { page, size: PAGE_SIZE }));
  const data = history.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-2 p-4">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-black">
          <Coins className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-fg-muted">{t.loyalty.balance}</p>
          {account.data ? (
            <p className="text-2xl font-bold tabular-nums">
              {formatPoints(account.data.balance, intlLocale)}{" "}
              <span className="text-sm font-medium text-fg-muted">
                · {t.loyalty.worth(formatVnd(account.data.balance * account.data.pointValue, intlLocale))}
              </span>
            </p>
          ) : account.error ? (
            <p className="text-sm font-medium text-danger">{getErrorMessage(account.error, t)}</p>
          ) : (
            <Skeleton className="mt-1 h-8 w-24" />
          )}
        </div>
        {!self && (
          <Button variant="outline" size="md" onClick={() => setAdjusting(true)} disabled={!account.data}>
            <SlidersHorizontal aria-hidden className="size-4" />
            {t.loyalty.adjust}
          </Button>
        )}
      </div>

      {history.error !== undefined && !data ? (
        <ErrorState error={history.error} onRetry={history.reload} />
      ) : !data ? (
        <LoadingState />
      ) : data.content.length === 0 ? (
        <EmptyState icon={Coins} title={t.loyalty.empty} />
      ) : (
        <div className={`transition-opacity ${history.loading ? "opacity-60" : ""}`}>
          <LoyaltyHistory entries={data.content} />
        </div>
      )}
      {data && data.content.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-fg-muted">{t.loyalty.historyTotal(data.totalElements)}</p>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      {adjusting && (
        <AdjustDialog
          userId={userId}
          onClose={() => setAdjusting(false)}
          onAdjusted={() => {
            setAdjusting(false);
            account.reload();
            setPage(0);
            history.reload();
          }}
        />
      )}
    </div>
  );
}

function AdjustDialog({ userId, onClose, onAdjusted }: { userId: number; onClose: () => void; onAdjusted: () => void }) {
  const t = useT();
  const toast = useToast();
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ points?: string; reason?: string }>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(points);
    const found = {
      points:
        points.trim() && Number.isInteger(value) && value !== 0 && Math.abs(value) <= MAX_ADJUST
          ? undefined
          : t.loyalty.pointsInvalid,
      reason: reason.trim() ? undefined : t.admin.validation.required,
    };
    setErrors(found);
    if (found.points || found.reason) return;
    setSaving(true);
    setFormError(null);
    try {
      await loyaltyApi.adjust(userId, { points: value, reason: reason.trim() });
      toast.success(t.loyalty.adjusted);
      onAdjusted();
    } catch (error) {
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={t.loyalty.adjust}
      description={t.loyalty.adjustHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="points-adjust-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="points-adjust-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <TextField
          label={t.loyalty.adjustPoints}
          required
          size="md"
          type="number"
          inputMode="numeric"
          step={1}
          placeholder="50 / -20"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          error={errors.points}
        />
        <TextField
          label={t.loyalty.reason}
          required
          size="md"
          maxLength={255}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors.reason}
        />
      </form>
    </Dialog>
  );
}
