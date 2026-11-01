"use client";

import { Armchair, Clapperboard, Grid3x3, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { CinemaScope } from "@/features/admin/components/cinema-scope";
import { adminChecks } from "@/features/admin/form-utils";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { roomApi } from "@/features/cinema/api";
import { ROOM_TYPES, type Room, type RoomStatus, type RoomType } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/** Rooms of one cinema as cards (BankDash Accounts): type, size, sellable seats, status, layout / edit / delete. */
export function AdminRoomsScreen({ cinemaId }: { cinemaId: number }) {
  return <CinemaScope cinemaId={cinemaId}>{() => <RoomList cinemaId={cinemaId} />}</CinemaScope>;
}

function RoomList({ cinemaId }: { cinemaId: number }) {
  const t = useT();
  const toast = useToast();
  const { user } = useSession();
  const canManage = hasAny(user, ["ROOM_MANAGE"]);
  const rooms = useApi(`rooms:${cinemaId}`, () => roomApi.list(cinemaId));
  const [dialog, setDialog] = useState<Room | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await roomApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      rooms.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.rooms.subtitle}</p>
        {canManage && (
          <Button size="md" onClick={() => setDialog("new")}>
            <Plus aria-hidden className="size-4" />
            {t.admin.rooms.add}
          </Button>
        )}
      </div>

      {rooms.error && !rooms.data ? (
        <ErrorState error={rooms.error} onRetry={rooms.reload} />
      ) : !rooms.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : rooms.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clapperboard}
            title={t.admin.rooms.empty}
            action={canManage && <Button size="md" onClick={() => setDialog("new")}>{t.admin.rooms.add}</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.data.map((room) => (
            <li key={room.id}>
              <Card className="flex h-full flex-col gap-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-black ${room.roomType.length > 2 ? "text-[11px]" : "text-sm"}`}>
                      {room.roomType}
                    </span>
                    <div>
                      <p className="text-h8">{room.name}</p>
                      <Badge tone={room.status === "ACTIVE" ? "success" : "warning"}>{t.admin.rooms.status[room.status]}</Badge>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex">
                      <IconButton label={t.common.editItem(room.name)} onClick={() => setDialog(room)}>
                        <Pencil aria-hidden className="size-4" />
                      </IconButton>
                      <IconButton label={t.common.deleteItem(room.name)} tone="danger" onClick={() => setToDelete(room)}>
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-surface-2 p-3">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
                      <Grid3x3 aria-hidden className="size-3.5" />
                      {t.admin.rooms.size}
                    </dt>
                    <dd className="font-bold">
                      {room.totalRows} × {room.totalColumns}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-3">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
                      <Armchair aria-hidden className="size-3.5" />
                      {t.admin.rooms.seats}
                    </dt>
                    <dd className="font-bold">{room.seatCount}</dd>
                  </div>
                </dl>
                <Link href={ROUTES.admin.roomLayout(room.id)} className={`${buttonClasses({ variant: "outline", size: "md" })} mt-auto`}>
                  <LayoutGrid aria-hidden className="size-4" />
                  {t.admin.rooms.layout}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {dialog === "new" && (
        <CreateRoomDialog cinemaId={cinemaId} onClose={() => setDialog(null)} onSaved={() => (setDialog(null), rooms.reload())} />
      )}
      {dialog && dialog !== "new" && (
        <EditRoomDialog room={dialog} onClose={() => setDialog(null)} onSaved={() => (setDialog(null), rooms.reload())} />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t.admin.rooms.deleteTitle}
        description={toDelete ? t.admin.rooms.deleteText(toDelete.name) : undefined}
        confirmLabel={t.common.delete}
      />
    </>
  );
}

/** Starting grid for a new room: standard rows, VIP rows at the back, optional couple row and centre aisle. */
export function templateGrid({ rows, columns, vipRows, coupleRow, aisle }: { rows: number; columns: number; vipRows: number; coupleRow: boolean; aisle: boolean }): string[] {
  const aisleAt = aisle ? Math.floor(columns / 2) : -1;
  return Array.from({ length: rows }, (_, r) => {
    const isCouple = coupleRow && r === rows - 1;
    const isVip = !isCouple && r >= rows - (coupleRow ? 1 : 0) - vipRows;
    const cells: string[] = [];
    for (let c = 0; c < columns; c++) {
      if (c === aisleAt) cells.push(".");
      else cells.push(isCouple ? "C" : isVip ? "V" : "S");
    }
    if (isCouple) {
      // Couple seats come in adjacent pairs: break any odd run with an aisle.
      let run = 0;
      for (let c = 0; c <= cells.length; c++) {
        if (c < cells.length && cells[c] === "C") run++;
        else {
          if (run % 2 === 1) cells[c - 1] = ".";
          run = 0;
        }
      }
    }
    return cells.join("");
  });
}

function CreateRoomDialog({ cinemaId, onClose, onSaved }: { cinemaId: number; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const check = adminChecks(t);
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("2D");
  const [rows, setRows] = useState("8");
  const [columns, setColumns] = useState("12");
  const [vipRows, setVipRows] = useState("2");
  const [coupleRow, setCoupleRow] = useState(true);
  const [aisle, setAisle] = useState(true);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = {
      name: check.required(name) ?? check.maxLength(name, 50),
      rows: check.intRange(rows, 1, 26),
      columns: check.intRange(columns, 2, 40),
      vipRows: check.intRange(vipRows, 0, 26),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    setFormError(null);
    try {
      const grid = templateGrid({ rows: +rows, columns: +columns, vipRows: Math.min(+vipRows, +rows), coupleRow, aisle });
      await roomApi.create(cinemaId, { name: name.trim(), roomType, grid });
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (error) {
      setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.admin.rooms.add}
      description={t.admin.rooms.templateHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="room-form" size="md" loading={saving}>
            {t.common.create}
          </Button>
        </>
      }
    >
      <form id="room-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">{getErrorMessage(formError, t)}</Alert>
          </div>
        )}
        <TextField label={t.admin.rooms.name} required size="md" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <SelectField label={t.admin.rooms.type} size="md" value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>
          {ROOM_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </SelectField>
        <TextField label={t.admin.rooms.rows} size="md" type="number" min={1} max={26} value={rows} onChange={(e) => setRows(e.target.value)} error={errors.rows} />
        <TextField label={t.admin.rooms.columns} size="md" type="number" min={2} max={40} value={columns} onChange={(e) => setColumns(e.target.value)} error={errors.columns} />
        <TextField label={t.admin.rooms.vipRows} size="md" type="number" min={0} value={vipRows} onChange={(e) => setVipRows(e.target.value)} error={errors.vipRows} />
        <div className="flex flex-col justify-end gap-3 pb-1">
          <Checkbox label={t.admin.rooms.coupleRow} checked={coupleRow} onChange={(e) => setCoupleRow(e.target.checked)} />
          <Checkbox label={t.admin.rooms.centerAisle} checked={aisle} onChange={(e) => setAisle(e.target.checked)} />
        </div>
      </form>
    </Dialog>
  );
}

function EditRoomDialog({ room, onClose, onSaved }: { room: Room; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const check = adminChecks(t);
  const [name, setName] = useState(room.name);
  const [roomType, setRoomType] = useState<RoomType>(room.roomType);
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = check.required(name) ?? check.maxLength(name, 50);
    setError(found);
    if (found) return;
    setSaving(true);
    setFormError(null);
    try {
      await roomApi.update(room.id, { name: name.trim(), roomType, status });
      toast.success(t.admin.common.saved);
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
      title={t.common.editItem(room.name)}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="room-edit-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="room-edit-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <TextField label={t.admin.rooms.name} required size="md" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <SelectField label={t.admin.rooms.type} size="md" value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>
          {ROOM_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </SelectField>
        <SelectField
          label={t.admin.common.status}
          size="md"
          value={status}
          onChange={(e) => setStatus(e.target.value as RoomStatus)}
          hint={t.admin.rooms.maintenanceHint}
        >
          <option value="ACTIVE">{t.admin.rooms.status.ACTIVE}</option>
          <option value="MAINTENANCE">{t.admin.rooms.status.MAINTENANCE}</option>
        </SelectField>
      </form>
    </Dialog>
  );
}
