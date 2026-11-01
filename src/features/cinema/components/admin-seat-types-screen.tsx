"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { Card, IconButton } from "@/components/ui/card";
import { controlClasses } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { seatTypeApi } from "@/features/cinema/api";
import type { SeatType } from "@/features/cinema/types";
import { useApi } from "@/hooks/use-api";
import { useLocale, useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnd } from "@/lib/format";

/** STANDARD / VIP / COUPLE (fixed codes): name, surcharge and border colour, edited inline. */
export function AdminSeatTypesScreen() {
  const t = useT();
  const types = useApi("seat-types", seatTypeApi.list);
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-fg-muted">{t.admin.seatTypes.subtitle}</p>
      <Card className="p-4 sm:p-6">
        {types.error && !types.data ? (
          <ErrorState error={types.error} onRetry={types.reload} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.admin.seatTypes.code}</Th>
                <Th>{t.admin.seatTypes.name}</Th>
                <Th>{t.admin.seatTypes.surcharge}</Th>
                <Th>{t.admin.seatTypes.color}</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!types.data ? (
              <TableSkeleton columns={5} rows={3} />
            ) : (
              <tbody>
                {types.data.map((type) =>
                  editing === type.id ? (
                    <EditRow
                      key={type.id}
                      type={type}
                      onDone={(saved) => {
                        setEditing(null);
                        if (saved) types.setData((list) => list?.map((it) => (it.id === saved.id ? saved : it)));
                      }}
                    />
                  ) : (
                    <ViewRow key={type.id} type={type} onEdit={() => setEditing(type.id)} />
                  ),
                )}
              </tbody>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}

function ViewRow({ type, onEdit }: { type: SeatType; onEdit: () => void }) {
  const t = useT();
  const { intlLocale } = useLocale();
  return (
    <tr>
      <Td>
        <code className="text-xs font-bold">{type.code}</code>
      </Td>
      <Td className="font-semibold text-fg">
        {type.name}
        <span className="block text-xs font-medium text-fg-subtle">{t.seat.type[type.code]}</span>
      </Td>
      <Td>{formatVnd(type.surcharge, intlLocale)}</Td>
      <Td>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="size-5 rounded border-2 bg-surface-2" style={{ borderColor: type.color ?? undefined }} />
          <code className="text-xs">{type.color ?? "—"}</code>
        </span>
      </Td>
      <Td className="text-right">
        <IconButton label={t.common.editItem(type.name)} onClick={onEdit}>
          <Pencil aria-hidden className="size-4" />
        </IconButton>
      </Td>
    </tr>
  );
}

function EditRow({ type, onDone }: { type: SeatType; onDone: (saved?: SeatType) => void }) {
  const t = useT();
  const toast = useToast();
  const [name, setName] = useState(type.name);
  const [surcharge, setSurcharge] = useState(String(type.surcharge));
  const [color, setColor] = useState(type.color ?? "#9797AA");
  const [saving, setSaving] = useState(false);
  const amount = Number(surcharge);
  const valid = name.trim().length > 0 && name.trim().length <= 50 && surcharge.trim() !== "" && amount >= 0 && amount <= 10_000_000;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      const saved = await seatTypeApi.update(type.id, { name: name.trim(), surcharge: amount, color: color.toUpperCase() });
      toast.success(t.admin.common.saved);
      onDone(saved);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
      setSaving(false);
    }
  }

  return (
    <tr className="bg-surface-2/50">
      <Td>
        <code className="text-xs font-bold">{type.code}</code>
      </Td>
      <Td>
        <input aria-label={t.admin.seatTypes.name} value={name} onChange={(e) => setName(e.target.value)} className={controlClasses({ size: "md", invalid: !name.trim() })} />
      </Td>
      <Td>
        <input
          aria-label={t.admin.seatTypes.surcharge}
          type="number"
          min={0}
          step={1000}
          value={surcharge}
          onChange={(e) => setSurcharge(e.target.value)}
          className={`${controlClasses({ size: "md", invalid: !valid && surcharge.trim() !== "" })} w-36`}
        />
      </Td>
      <Td>
        <input
          aria-label={t.admin.seatTypes.color}
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded border border-line-strong bg-surface-2 p-1"
        />
      </Td>
      <Td>
        <div className="flex justify-end gap-1">
          <IconButton label={t.common.save} onClick={save} disabled={!valid || saving}>
            <Check aria-hidden className="size-4 text-success" />
          </IconButton>
          <IconButton label={t.common.cancel} onClick={() => onDone()} disabled={saving}>
            <X aria-hidden className="size-4" />
          </IconButton>
        </div>
      </Td>
    </tr>
  );
}
