"use client";

import { ArrowLeft, Eye, FileClock, Lock, LockOpen, Plus, ReceiptText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/layout/user-menu";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny, roleLabel } from "@/features/auth/permissions";
import type { UserRole } from "@/features/auth/types";
import { BookingDetailDialog } from "@/features/booking/components/admin-bookings-screen";
import { BOOKING_STATUS_TONES } from "@/features/booking/components/my-bookings";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/features/booking/types";
import { rbacApi, userApi } from "@/features/user/api";
import type { UserDetail } from "@/features/user/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDate, formatDateTime, formatVnd } from "@/lib/format";

const STATUS_TONE = { ACTIVE: "success", PENDING: "warning", LOCKED: "danger" } as const;
const BOOKINGS_PAGE_SIZE = 10;

/** BankDash Setting layout: header with lock / unlock, tabs Roles · Bookings (BOOKING_VIEW_ALL). */
export function AdminUserDetail({ userId }: { userId: string }) {
  const t = useT();
  const { user: me } = useSession();
  const detail = useApi(`user:${userId}`, () => userApi.get(userId));
  const [tab, setTab] = useState<"roles" | "bookings">("roles");
  const canSeeBookings = hasAny(me, ["BOOKING_VIEW_ALL"]);

  if (detail.error && !detail.data) return <ErrorState error={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <Link href={ROUTES.admin.users} className={`${buttonClasses({ variant: "ghost", size: "md" })} w-fit`}>
        <ArrowLeft aria-hidden className="size-4" />
        {t.admin.users.back}
      </Link>
      <Header detail={detail.data} onChange={(next) => detail.setData(() => next)} />
      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <Tabs
          label={t.admin.users.tabs}
          value={tab}
          onChange={setTab}
          items={[
            { value: "roles", label: t.admin.users.rolesTab, count: detail.data.roles.length },
            ...(canSeeBookings ? [{ value: "bookings" as const, label: t.admin.users.bookingsTab }] : []),
          ]}
        />
        {tab === "bookings" && canSeeBookings ? (
          <UserBookings userId={detail.data.user.id} />
        ) : (
          <Roles detail={detail.data} onChange={(roles) => detail.setData((d) => (d ? { ...d, roles } : d))} />
        )}
      </Card>
    </div>
  );
}

function Header({ detail, onChange }: { detail: UserDetail; onChange: (detail: UserDetail) => void }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { user: me } = useSession();
  const { user } = detail;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = user.status === "LOCKED";
  const self = me?.id === user.id;

  async function toggleLock() {
    setBusy(true);
    try {
      const updated = locked ? await userApi.unlock(user.id) : await userApi.lock(user.id);
      onChange({ ...detail, user: updated });
      toast.success(locked ? t.admin.users.unlocked : t.admin.users.locked);
      setConfirming(false);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  const facts = [
    { label: t.auth.phone, value: user.phone ?? "—" },
    { label: t.admin.users.createdAt, value: formatDate(user.createdAt, intlLocale) },
    { label: t.admin.users.lastLogin, value: user.lastLoginAt ? formatDateTime(user.lastLoginAt, intlLocale) : "—" },
    { label: t.admin.users.verifiedAt, value: user.emailVerifiedAt ? formatDate(user.emailVerifiedAt, intlLocale) : "—" },
  ];

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-h6 truncate">{user.fullName}</p>
            <Badge tone={STATUS_TONE[user.status]}>{t.userStatus[user.status]}</Badge>
            <span className="text-xs font-semibold text-fg-subtle">#{user.id}</span>
          </div>
          <p className="truncate text-sm font-medium text-fg-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAny(me, ["AUDIT_LOG_VIEW"]) && (
            <Link
              href={`${ROUTES.admin.auditLogs}?entityType=USER&entityId=${user.id}`}
              className={buttonClasses({ variant: "outline", size: "md" })}
            >
              <FileClock aria-hidden className="size-4" />
              {t.admin.users.viewAudit}
            </Link>
          )}
          {!self && (
            <Button variant={locked ? "outline" : "danger"} size="md" onClick={() => setConfirming(true)}>
              {locked ? <LockOpen aria-hidden className="size-4" /> : <Lock aria-hidden className="size-4" />}
              {locked ? t.admin.users.unlock : t.admin.users.lock}
            </Button>
          )}
        </div>
      </div>
      <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs font-semibold text-fg-muted">{fact.label}</dt>
            <dd className="text-sm font-bold">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggleLock}
        loading={busy}
        tone={locked ? "primary" : "danger"}
        title={locked ? t.admin.users.unlockTitle(user.fullName) : t.admin.users.lockTitle(user.fullName)}
        description={locked ? undefined : t.admin.users.lockText}
        confirmLabel={locked ? t.admin.users.unlock : t.admin.users.lock}
      />
    </Card>
  );
}

/** Bookings of the account (online and counter sales tied to it), newest first, with the staff booking dialog. */
function UserBookings({ userId }: { userId: number }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Booking | null>(null);
  const query = { status: status || undefined, page, size: BOOKINGS_PAGE_SIZE };
  const bookings = useApi(`user:${userId}:bookings:${JSON.stringify(query)}`, () => userApi.bookings(userId, query));
  const list = bookings.data?.content ?? [];

  return (
    <>
      <div className="flex justify-end">
        <Select
          aria-label={t.admin.common.status}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BookingStatus | "");
            setPage(0);
          }}
          className="w-full sm:w-56"
        >
          <option value="">{t.common.all}</option>
          {BOOKING_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t.booking.status[value]}
            </option>
          ))}
        </Select>
      </div>
      {bookings.error && !bookings.data ? (
        <ErrorState error={bookings.error} onRetry={bookings.reload} />
      ) : bookings.data && list.length === 0 ? (
        <EmptyState icon={ReceiptText} title={t.admin.users.bookingsEmpty} />
      ) : (
        <Table className="min-w-[840px]">
          <thead>
            <tr>
              <Th>{t.booking.bookingCode}</Th>
              <Th>{t.booking.time}</Th>
              <Th>{t.booking.seats}</Th>
              <Th>{t.admin.bookings.channel}</Th>
              <Th className="text-right">{t.booking.totalToPay}</Th>
              <Th>{t.admin.common.status}</Th>
              <Th>{t.admin.bookings.createdAt}</Th>
              <Th className="text-right">{t.admin.common.actions}</Th>
            </tr>
          </thead>
          {!bookings.data ? (
            <TableSkeleton columns={8} />
          ) : (
            <tbody>
              {list.map((booking) => (
                <tr key={booking.id} className="hover:bg-surface-2/50">
                  <Td className="font-mono font-bold text-fg">{booking.bookingCode}</Td>
                  <Td>
                    {booking.showtime ? (
                      <div className="min-w-0">
                        <p className="font-semibold text-fg">{booking.showtime.movie.title}</p>
                        <p className="text-xs text-fg-muted">
                          {formatDateTime(booking.showtime.startTime, intlLocale)} · {booking.showtime.cinema.name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-fg-subtle">–</span>
                    )}
                  </Td>
                  <Td>
                    {booking.tickets.map((ticket) => ticket.seatCode).join(", ") ||
                      booking.seats.map((seat) => seat.seatCode).join(", ") ||
                      "–"}
                  </Td>
                  <Td>
                    <Badge tone={booking.channel === "COUNTER" ? "accent" : "info"}>{t.booking.channel[booking.channel]}</Badge>
                  </Td>
                  <Td className="text-right font-semibold whitespace-nowrap text-fg tabular-nums">
                    {formatVnd(booking.totalAmount, intlLocale)}
                  </Td>
                  <Td>
                    <Badge tone={BOOKING_STATUS_TONES[booking.status]}>{t.booking.status[booking.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDateTime(booking.createdAt, intlLocale)}</Td>
                  <Td className="text-right">
                    <IconButton label={t.admin.bookings.view(booking.bookingCode)} onClick={() => setDetail(booking)}>
                      <Eye aria-hidden className="size-4" />
                    </IconButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          )}
        </Table>
      )}
      {bookings.data && list.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-fg-muted">{t.admin.users.bookingsTotal(bookings.data.totalElements)}</p>
          <Pagination page={bookings.data.page} totalPages={bookings.data.totalPages} onChange={setPage} />
        </div>
      )}
      <BookingDetailDialog booking={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function Roles({ detail, onChange }: { detail: UserDetail; onChange: (roles: UserRole[]) => void }) {
  const t = useT();
  const toast = useToast();
  const { intlLocale } = useLocale();
  const { user: me } = useSession();
  const { cinemas } = useAdminCinema();
  const canAssign = hasAny(me, ["ROLE_MANAGE"]);
  const [assigning, setAssigning] = useState(false);
  const [toRemove, setToRemove] = useState<UserRole | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await userApi.removeRole(detail.user.id, toRemove.id);
      onChange(detail.roles.filter((r) => r.id !== toRemove.id));
      toast.success(t.admin.users.roleRemoved);
      setToRemove(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {canAssign && (
        <div className="flex justify-end">
          <Button size="md" onClick={() => setAssigning(true)}>
            <Plus aria-hidden className="size-4" />
            {t.admin.users.assign}
          </Button>
        </div>
      )}
      {detail.roles.length === 0 ? (
        <EmptyState title={t.admin.users.noRoles} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.admin.users.role}</Th>
              <Th>{t.admin.roles.scope}</Th>
              <Th>{t.admin.users.cinema}</Th>
              <Th>{t.admin.staff.assignedAt}</Th>
              {canAssign && <Th className="text-right">{t.admin.common.actions}</Th>}
            </tr>
          </thead>
          <tbody>
            {detail.roles.map((role) => {
              const selfAdmin = me?.id === detail.user.id && role.roleCode === "ADMIN";
              return (
                <tr key={role.id}>
                  <Td>
                    <p className="font-bold text-fg">{roleLabel(role, t)}</p>
                    <code className="text-xs">{role.roleCode}</code>
                  </Td>
                  <Td>
                    <Badge tone={role.scopeType === "GLOBAL" ? "accent" : "info"}>{t.admin.roles.scopes[role.scopeType]}</Badge>
                  </Td>
                  <Td>{role.cinemaId ? (cinemas.find((c) => c.id === role.cinemaId)?.name ?? `#${role.cinemaId}`) : "—"}</Td>
                  <Td>{formatDate(role.assignedAt, intlLocale)}</Td>
                  {canAssign && (
                    <Td className="text-right">
                      <IconButton
                        label={t.admin.users.removeRole(roleLabel(role, t))}
                        tone="danger"
                        disabled={selfAdmin}
                        title={selfAdmin ? t.admin.users.cannotRemoveOwnAdmin : undefined}
                        onClick={() => setToRemove(role)}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      {assigning && (
        <AssignRoleDialog
          userId={detail.user.id}
          onClose={() => setAssigning(false)}
          onAssigned={(role) => {
            onChange([...detail.roles, role]);
            setAssigning(false);
          }}
        />
      )}
      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        loading={removing}
        title={t.admin.users.removeRoleTitle}
        description={toRemove ? t.admin.users.removeRoleText(roleLabel(toRemove, t)) : undefined}
        confirmLabel={t.admin.staff.remove}
      />
    </>
  );
}

function AssignRoleDialog({ userId, onClose, onAssigned }: { userId: number; onClose: () => void; onAssigned: (role: UserRole) => void }) {
  const t = useT();
  const toast = useToast();
  const roles = useApi("rbac:roles", rbacApi.roles);
  const { cinemas } = useAdminCinema();
  const [roleCode, setRoleCode] = useState("");
  const [cinemaId, setCinemaId] = useState("");
  const [errors, setErrors] = useState<{ role?: string; cinema?: string }>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const role = roles.data?.find((r) => r.code === roleCode);
  const needsCinema = role?.scopeType === "CINEMA";

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = {
      role: roleCode ? undefined : t.admin.validation.required,
      cinema: needsCinema && !cinemaId ? t.admin.users.cinemaRequired : undefined,
    };
    setErrors(found);
    if (found.role || found.cinema) return;
    setSaving(true);
    setFormError(null);
    try {
      const assigned = await userApi.assignRole(userId, { roleCode, cinemaId: needsCinema ? Number(cinemaId) : undefined });
      toast.success(t.admin.users.roleAssigned);
      onAssigned(assigned);
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
      title={t.admin.users.assign}
      description={t.admin.users.assignHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="assign-form" size="md" loading={saving}>
            {t.admin.users.assign}
          </Button>
        </>
      }
    >
      <form id="assign-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <SelectField label={t.admin.users.role} required size="md" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} error={errors.role}>
          <option value="">{t.admin.users.pickRole}</option>
          {roles.data?.map((r) => (
            <option key={r.code} value={r.code}>
              {roleLabel(r, t)} · {t.admin.roles.scopes[r.scopeType]}
            </option>
          ))}
        </SelectField>
        {needsCinema && (
          <SelectField label={t.admin.users.cinema} required size="md" value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} error={errors.cinema}>
            <option value="">{t.admin.pickCinema}</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
      </form>
    </Dialog>
  );
}
