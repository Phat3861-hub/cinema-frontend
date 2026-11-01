"use client";

import { Trash2, UserPlus, UsersRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { CinemaScope } from "@/features/admin/components/cinema-scope";
import { useSession } from "@/features/auth/components/session-provider";
import { roleLabel } from "@/features/auth/permissions";
import { fieldMessage, validateEmail, type ValidationKey } from "@/features/auth/validation";
import { staffApi } from "@/features/cinema/api";
import type { CinemaStaff } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { errorCodeOf, getErrorMessage } from "@/lib/error-messages";
import { formatDate } from "@/lib/format";

const STATUS_TONE = { ACTIVE: "success", PENDING: "warning", LOCKED: "danger" } as const;

/** Staff of one cinema (TICKET_STAFF + CINEMA_MANAGER); add ticket staff by email, remove ticket staff. */
export function AdminStaffScreen({ cinemaId }: { cinemaId: number }) {
  return <CinemaScope cinemaId={cinemaId}>{() => <StaffList cinemaId={cinemaId} />}</CinemaScope>;
}

function StaffList({ cinemaId }: { cinemaId: number }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { user } = useSession();
  const staff = useApi(`staff:${cinemaId}`, () => staffApi.list(cinemaId));
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<CinemaStaff | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await staffApi.remove(cinemaId, toRemove.userId);
      toast.success(t.admin.staff.removed(toRemove.fullName));
      setToRemove(null);
      staff.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.staff.subtitle}</p>
        <Button size="md" onClick={() => setAdding(true)}>
          <UserPlus aria-hidden className="size-4" />
          {t.admin.staff.add}
        </Button>
      </div>
      <Card className="p-4 sm:p-6">
        {staff.error && !staff.data ? (
          <ErrorState error={staff.error} onRetry={staff.reload} />
        ) : staff.data?.length === 0 ? (
          <EmptyState icon={UsersRound} title={t.admin.staff.empty} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.admin.users.colUser}</Th>
                <Th>{t.admin.staff.role}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th>{t.admin.staff.assignedAt}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!staff.data ? (
              <TableSkeleton columns={5} />
            ) : (
              <tbody>
                {staff.data.map((member) => (
                  <tr key={member.userRoleId}>
                    <Td>
                      <p className="font-bold text-fg">{member.fullName}</p>
                      <p className="text-xs">{member.email}</p>
                    </Td>
                    <Td>
                      <Badge tone={member.roleCode === "CINEMA_MANAGER" ? "accent" : "neutral"}>{roleLabel(member, t)}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[member.status]}>{t.userStatus[member.status]}</Badge>
                    </Td>
                    <Td>{formatDate(member.assignedAt, intlLocale)}</Td>
                    <Td className="text-right">
                      {member.roleCode === "TICKET_STAFF" && member.userId !== user?.id ? (
                        <IconButton label={t.admin.staff.removeItem(member.fullName)} tone="danger" onClick={() => setToRemove(member)}>
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      ) : (
                        <span className="text-xs text-fg-subtle">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
      </Card>
      <p className="text-xs font-medium text-fg-muted">{t.admin.staff.managerHint}</p>

      {adding && <AddStaffDialog cinemaId={cinemaId} onClose={() => setAdding(false)} onSaved={() => (setAdding(false), staff.reload())} />}
      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        loading={removing}
        title={t.admin.staff.removeTitle}
        description={toRemove ? t.admin.staff.removeText(toRemove.fullName) : undefined}
        confirmLabel={t.admin.staff.remove}
      />
    </>
  );
}

function AddStaffDialog({ cinemaId, onClose, onSaved }: { cinemaId: number; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ValidationKey>();
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateEmail(email);
    setError(found);
    if (found) return;
    setSaving(true);
    setFormError(null);
    try {
      const added = await staffApi.add(cinemaId, email.trim());
      toast.success(t.admin.staff.added(added.fullName));
      onSaved();
    } catch (err) {
      setFormError(err);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={t.admin.staff.add}
      description={t.admin.staff.addHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="staff-form" size="md" loading={saving}>
            {t.admin.staff.addButton}
          </Button>
        </>
      }
    >
      <form id="staff-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && (
          <Alert tone="error">
            {errorCodeOf(formError) === "USER_NOT_FOUND" ? t.admin.staff.userNotFound : getErrorMessage(formError, t)}
          </Alert>
        )}
        <TextField
          label={t.auth.email}
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldMessage(t, error)}
        />
      </form>
    </Dialog>
  );
}
