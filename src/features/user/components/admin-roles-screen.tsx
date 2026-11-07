"use client";

import { Lock, Pencil, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Segmented } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/features/auth/components/session-provider";
import { permissionLabel, roleLabel } from "@/features/auth/permissions";
import type { RoleScope } from "@/features/auth/types";
import { rbacApi } from "@/features/user/api";
import type { Permission, Role } from "@/features/user/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { errorCodeOf, getErrorMessage } from "@/lib/error-messages";

const MODULE_ORDER = ["MOVIE", "CONTENT", "CINEMA", "SHOWTIME", "BOOKING", "PAYMENT", "PROMOTION", "REPORT", "USER", "SYSTEM"];
const PROTECTED_ROLE = "ADMIN";
const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{1,49}$/;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

function groupByModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) groups.set(p.module, [...(groups.get(p.module) ?? []), p]);
  return [...groups.entries()].sort(([a], [b]) => {
    const ia = MODULE_ORDER.indexOf(a);
    const ib = MODULE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

/** A CINEMA role only takes permissions the backend checks per cinema; the others act on the whole system. */
function allowedFor(role: Pick<Role, "scopeType">, permission: Permission) {
  return role.scopeType === "GLOBAL" || permission.cinemaScoped;
}

/**
 * Roles on the left (create / rename / delete custom roles), permission matrix grouped by module on the right
 * (ADMIN is read-only, CINEMA roles only take per-cinema permissions); plus a compare view.
 */
export function AdminRolesScreen() {
  const t = useT();
  const roles = useApi("rbac:roles", rbacApi.roles);
  const permissions = useApi("rbac:permissions", rbacApi.permissions);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"edit" | "compare">("edit");
  const [creating, setCreating] = useState(false);

  const error = roles.error ?? permissions.error;
  if (error && !(roles.data && permissions.data)) return <ErrorState error={error} onRetry={() => (roles.reload(), permissions.reload())} />;
  if (!roles.data || !permissions.data) return <LoadingState />;

  const selected = roles.data.find((r) => r.id === selectedId) ?? roles.data[0];
  const groups = groupByModule(permissions.data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.roles.subtitle}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label={t.admin.roles.view}
            value={view}
            onChange={setView}
            items={[
              { value: "edit", label: t.admin.roles.editView },
              { value: "compare", label: t.admin.roles.compareView },
            ]}
          />
          <Button size="md" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            {t.admin.roles.create}
          </Button>
        </div>
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
                        <span className="min-w-0 truncate">{roleLabel(role, t)}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-fg-muted">
                        <code className="max-w-full truncate">{role.code}</code>·<span>{t.admin.roles.scopes[role.scopeType]}</span>·
                        <span>{t.admin.roles.permissionCount(role.permissions.length)}</span>·
                        <span>{t.admin.roles.userCount(role.userCount)}</span>
                        <Badge tone={role.system ? "neutral" : "accent"} className="px-1.5 text-[10px]">
                          {role.system ? t.admin.roles.system : t.admin.roles.custom}
                        </Badge>
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
              onDeleted={(id) => {
                roles.setData((list) => list?.filter((r) => r.id !== id));
                setSelectedId(null);
              }}
            />
          )}
        </div>
      )}

      {creating && (
        <RoleFormDialog
          onClose={() => setCreating(false)}
          onSaved={(role) => {
            roles.setData((list) => [...(list ?? []), role]);
            setSelectedId(role.id);
            setView("edit");
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function RoleEditor({
  role,
  groups,
  onSaved,
  onDeleted,
}: {
  role: Role;
  groups: [string, Permission[]][];
  onSaved: (role: Role) => void;
  onDeleted: (roleId: number) => void;
}) {
  const t = useT();
  const toast = useToast();
  const { reload } = useSession();
  const locked = role.code === PROTECTED_ROLE;
  const [checked, setChecked] = useState<Set<string>>(() => new Set(role.permissions));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const original = new Set(role.permissions);
  const added = [...checked].filter((c) => !original.has(c));
  const removed = [...original].filter((c) => !checked.has(c));
  const dirty = added.length + removed.length > 0;
  // A permission the role may not take stays editable only to be unticked
  const editable = (p: Permission) => !locked && (allowedFor(role, p) || checked.has(p.code));

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

  async function remove() {
    setRemoving(true);
    try {
      await rbacApi.deleteRole(role.id);
      toast.success(t.admin.roles.deleted);
      onDeleted(role.id);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
      setRemoving(false);
      setDeleting(false);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h8 flex items-center gap-2">
            <ShieldCheck aria-hidden className="size-5 shrink-0" />
            <span className="min-w-0 break-words">{roleLabel(role, t)}</span>
          </h2>
          {role.description && <p className="mt-1 max-w-2xl text-sm font-medium text-fg-muted">{role.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!role.system && (
            <>
              <Button variant="outline" size="md" onClick={() => setRenaming(true)}>
                <Pencil aria-hidden className="size-4" />
                {t.admin.roles.edit}
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="text-danger"
                disabled={role.userCount > 0}
                title={role.userCount > 0 ? t.admin.roles.inUse(role.userCount) : undefined}
                onClick={() => setDeleting(true)}
              >
                <Trash2 aria-hidden className="size-4" />
                {t.admin.roles.delete}
              </Button>
            </>
          )}
          {!locked && (
            <>
              <Button variant="ghost" size="md" disabled={!dirty} onClick={() => setChecked(new Set(role.permissions))}>
                <RotateCcw aria-hidden className="size-4" />
                {t.admin.layout.reset}
              </Button>
              <Button size="md" disabled={!dirty} onClick={() => setConfirming(true)}>
                <Save aria-hidden className="size-4" />
                {t.common.save}
              </Button>
            </>
          )}
        </div>
      </div>
      {locked && <Alert tone="info">{t.admin.roles.adminLocked}</Alert>}
      {!locked && role.scopeType === "CINEMA" && <Alert tone="info">{t.admin.roles.cinemaOnly}</Alert>}
      {!role.system && role.userCount > 0 && <p className="text-xs font-semibold text-fg-muted">{t.admin.roles.inUse(role.userCount)}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map(([module, items]) => {
          const codes = items.filter(editable).map((p) => p.code);
          const on = items.filter((p) => checked.has(p.code)).length;
          return (
            <fieldset key={module} className="rounded-xl border border-line p-4">
              <legend className="px-1">
                <Checkbox
                  label={<span className="font-bold">{t.admin.roles.modules[module as keyof typeof t.admin.roles.modules] ?? module}</span>}
                  description={`${on}/${items.length}`}
                  checked={on > 0 && on === items.length}
                  indeterminate={on > 0 && on < items.length}
                  disabled={codes.length === 0}
                  onChange={(e) => toggle(codes, e.target.checked)}
                />
              </legend>
              <div className="mt-3 flex flex-col gap-3">
                {items.map((p) => (
                  <Checkbox
                    key={p.code}
                    label={permissionLabel(p.code, t)}
                    description={allowedFor(role, p) ? p.code : `${p.code} · ${t.admin.roles.globalOnly}`}
                    checked={checked.has(p.code)}
                    disabled={!editable(p)}
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

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        loading={removing}
        title={t.admin.roles.deleteTitle(roleLabel(role, t))}
        description={t.admin.roles.deleteText}
        confirmLabel={t.admin.roles.delete}
      />

      {renaming && (
        <RoleFormDialog
          role={role}
          onClose={() => setRenaming(false)}
          onSaved={(saved) => {
            onSaved(saved);
            setRenaming(false);
          }}
        />
      )}
    </Card>
  );
}

/** Create a role (code, name, description, scope) or rename a custom one (name, description). */
function RoleFormDialog({ role, onClose, onSaved }: { role?: Role; onClose: () => void; onSaved: (role: Role) => void }) {
  const t = useT();
  const toast = useToast();
  const editing = role !== undefined;
  const [code, setCode] = useState("");
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [scopeType, setScopeType] = useState<RoleScope>("GLOBAL");
  const [errors, setErrors] = useState<{ code?: string; name?: string; description?: string }>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = {
      code: editing ? undefined : !code.trim() ? t.admin.validation.required : CODE_PATTERN.test(code.trim()) ? undefined : t.admin.roles.codeInvalid,
      name: !name.trim() ? t.admin.validation.required : name.trim().length > NAME_MAX ? t.admin.validation.tooLong(NAME_MAX) : undefined,
      description: description.trim().length > DESCRIPTION_MAX ? t.admin.validation.tooLong(DESCRIPTION_MAX) : undefined,
    };
    setErrors(found);
    if (found.code || found.name || found.description) return;
    setSaving(true);
    setFormError(null);
    try {
      const body = { name: name.trim(), description: description.trim() || undefined };
      const saved = editing
        ? await rbacApi.updateRole(role.id, body)
        : await rbacApi.createRole({ ...body, code: code.trim(), scopeType, permissionCodes: [] });
      toast.success(editing ? t.admin.roles.updated : t.admin.roles.created(saved.name));
      onSaved(saved);
    } catch (error) {
      if (errorCodeOf(error) === "ROLE_CODE_EXISTS") setErrors({ code: t.errors.ROLE_CODE_EXISTS });
      else setFormError(error);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={editing ? t.admin.roles.editTitle : t.admin.roles.create}
      description={editing ? undefined : t.admin.roles.createHint}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="role-form" size="md" loading={saving}>
            {editing ? t.common.save : t.admin.roles.create}
          </Button>
        </>
      }
    >
      <form id="role-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        {!editing && (
          <TextField
            label={t.admin.roles.code}
            required
            size="md"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            hint={t.admin.roles.codeHint}
            error={errors.code}
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        )}
        <TextField
          label={t.admin.roles.name}
          required
          size="md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={NAME_MAX}
        />
        <TextareaField
          label={t.admin.roles.description}
          optional
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          maxLength={DESCRIPTION_MAX}
        />
        {!editing && (
          <SelectField
            label={t.admin.roles.scope}
            required
            size="md"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value as RoleScope)}
            hint={t.admin.roles.scopeHint[scopeType]}
          >
            <option value="GLOBAL">{t.admin.roles.scopes.GLOBAL}</option>
            <option value="CINEMA">{t.admin.roles.scopes.CINEMA}</option>
          </SelectField>
        )}
      </form>
    </Dialog>
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
