"use client";

import { Lock, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Segmented } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/features/auth/components/session-provider";
import { permissionLabel, roleLabel } from "@/features/auth/permissions";
import { rbacApi } from "@/features/user/api";
import type { Permission, Role } from "@/features/user/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

const MODULE_ORDER = ["MOVIE", "CONTENT", "CINEMA", "SHOWTIME", "BOOKING", "PAYMENT", "PROMOTION", "REPORT", "USER", "SYSTEM"];
const PROTECTED_ROLE = "ADMIN";

function groupByModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) groups.set(p.module, [...(groups.get(p.module) ?? []), p]);
  return [...groups.entries()].sort(([a], [b]) => {
    const ia = MODULE_ORDER.indexOf(a);
    const ib = MODULE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

/** Roles on the left, permission matrix grouped by module on the right (ADMIN is read-only); plus a compare view. */
export function AdminRolesScreen() {
  const t = useT();
  const roles = useApi("rbac:roles", rbacApi.roles);
  const permissions = useApi("rbac:permissions", rbacApi.permissions);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"edit" | "compare">("edit");

  const error = roles.error ?? permissions.error;
  if (error && !(roles.data && permissions.data)) return <ErrorState error={error} onRetry={() => (roles.reload(), permissions.reload())} />;
  if (!roles.data || !permissions.data) return <LoadingState />;

  const selected = roles.data.find((r) => r.id === selectedId) ?? roles.data[0];
  const groups = groupByModule(permissions.data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.roles.subtitle}</p>
        <Segmented
          label={t.admin.roles.view}
          value={view}
          onChange={setView}
          items={[
            { value: "edit", label: t.admin.roles.editView },
            { value: "compare", label: t.admin.roles.compareView },
          ]}
        />
      </div>

      {view === "compare" ? (
        <CompareMatrix roles={roles.data} groups={groups} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="p-2">
            <ul className="flex flex-col gap-1" aria-label={t.admin.roles.list}>
              {roles.data.map((role) => {
                const active = role.id === selected?.id;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(role.id)}
                      className={`flex w-full cursor-pointer flex-col gap-1 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                        active ? "bg-accent/10" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-bold">
                        {role.code === PROTECTED_ROLE && <Lock aria-hidden className="size-3.5 text-fg-muted" />}
                        {roleLabel(role, t)}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-fg-muted">
                        <code>{role.code}</code>·<span>{t.admin.roles.scopes[role.scopeType]}</span>·
                        <span>{t.admin.roles.permissionCount(role.permissions.length)}</span>
                        {role.system && <Badge className="px-1.5 text-[10px]">{t.admin.roles.system}</Badge>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          {selected && (
            <RoleEditor
              key={`${selected.id}:${selected.permissions.join(",")}`}
              role={selected}
              groups={groups}
              onSaved={(saved) => roles.setData((list) => list?.map((r) => (r.id === saved.id ? saved : r)))}
            />
          )}
        </div>
      )}
    </div>
  );
}

function RoleEditor({ role, groups, onSaved }: { role: Role; groups: [string, Permission[]][]; onSaved: (role: Role) => void }) {
  const t = useT();
  const toast = useToast();
  const { reload } = useSession();
  const locked = role.code === PROTECTED_ROLE;
  const [checked, setChecked] = useState<Set<string>>(() => new Set(role.permissions));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const original = new Set(role.permissions);
  const added = [...checked].filter((c) => !original.has(c));
  const removed = [...original].filter((c) => !checked.has(c));
  const dirty = added.length + removed.length > 0;

  function toggle(codes: string[], on: boolean) {
    setChecked((current) => {
      const next = new Set(current);
      codes.forEach((code) => (on ? next.add(code) : next.delete(code)));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await rbacApi.setRolePermissions(role.id, [...checked]);
      onSaved(saved);
      toast.success(t.admin.roles.saved);
      setConfirming(false);
      // The current user may hold this role: refresh /me so the menu follows (token permissions update on next refresh).
      void reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h8 flex items-center gap-2">
            <ShieldCheck aria-hidden className="size-5" />
            {roleLabel(role, t)}
          </h2>
          {role.description && <p className="mt-1 max-w-2xl text-sm font-medium text-fg-muted">{role.description}</p>}
        </div>
        {!locked && (
          <div className="flex gap-2">
            <Button variant="ghost" size="md" disabled={!dirty} onClick={() => setChecked(new Set(role.permissions))}>
              <RotateCcw aria-hidden className="size-4" />
              {t.admin.layout.reset}
            </Button>
            <Button size="md" disabled={!dirty} onClick={() => setConfirming(true)}>
              <Save aria-hidden className="size-4" />
              {t.common.save}
            </Button>
          </div>
        )}
      </div>
      {locked && <Alert tone="info">{t.admin.roles.adminLocked}</Alert>}

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map(([module, items]) => {
          const codes = items.map((p) => p.code);
          const on = codes.filter((c) => checked.has(c)).length;
          return (
            <fieldset key={module} className="rounded-xl border border-line p-4">
              <legend className="px-1">
                <Checkbox
                  label={<span className="font-bold">{t.admin.roles.modules[module as keyof typeof t.admin.roles.modules] ?? module}</span>}
                  description={`${on}/${codes.length}`}
                  checked={on === codes.length}
                  indeterminate={on > 0 && on < codes.length}
                  disabled={locked}
                  onChange={(e) => toggle(codes, e.target.checked)}
                />
              </legend>
              <div className="mt-3 flex flex-col gap-3">
                {items.map((p) => (
                  <Checkbox
                    key={p.code}
                    label={permissionLabel(p.code, t)}
                    description={p.code}
                    checked={checked.has(p.code)}
                    disabled={locked}
                    onChange={(e) => toggle([p.code], e.target.checked)}
                  />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={save}
        loading={saving}
        tone="primary"
        title={t.admin.roles.confirmTitle(roleLabel(role, t))}
        description={t.admin.roles.confirmHint}
        confirmLabel={t.common.save}
      >
        <div className="flex flex-col gap-4 text-sm">
          {added.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-success">+ {t.admin.roles.added(added.length)}</p>
              <ul className="list-disc pl-5 font-medium text-fg-2">
                {added.map((c) => (
                  <li key={c}>{permissionLabel(c, t)}</li>
                ))}
              </ul>
            </div>
          )}
          {removed.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-danger">− {t.admin.roles.removed(removed.length)}</p>
              <ul className="list-disc pl-5 font-medium text-fg-2">
                {removed.map((c) => (
                  <li key={c}>{permissionLabel(c, t)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ConfirmDialog>
    </Card>
  );
}

function CompareMatrix({ roles, groups }: { roles: Role[]; groups: [string, Permission[]][] }) {
  const t = useT();
  return (
    <Card className="overflow-x-auto p-4 sm:p-6">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 border-b border-line bg-surface px-3 py-3 text-left text-xs font-semibold text-fg-muted uppercase">
              {t.admin.roles.permission}
            </th>
            {roles.map((role) => (
              <th key={role.id} scope="col" className="border-b border-line px-3 py-3 text-center text-xs font-bold">
                {roleLabel(role, t)}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map(([module, items]) => (
          <tbody key={module}>
            <tr>
              <th colSpan={roles.length + 1} scope="rowgroup" className="bg-surface-2 px-3 py-2 text-left text-xs font-bold uppercase">
                {t.admin.roles.modules[module as keyof typeof t.admin.roles.modules] ?? module}
              </th>
            </tr>
            {items.map((p) => (
              <tr key={p.code}>
                <th scope="row" className="sticky left-0 border-b border-line bg-surface px-3 py-2 text-left font-medium text-fg-2">
                  {permissionLabel(p.code, t)}
                  <code className="block text-[11px] text-fg-subtle">{p.code}</code>
                </th>
                {roles.map((role) => {
                  const has = role.permissions.includes(p.code);
                  return (
                    <td key={role.id} className="border-b border-line px-3 py-2 text-center">
                      {has ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">✓</span>
                      ) : (
                        <span className="text-fg-subtle">–</span>
                      )}
                      <span className="sr-only">{has ? t.common.yes : t.common.no}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </Card>
  );
}
