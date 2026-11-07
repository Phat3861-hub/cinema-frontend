"use client";

import { ChevronDown, Copy, FileClock, History, Search, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { controlClasses } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { auditApi } from "@/features/audit/api";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
  type AuditLog,
  type AuditLogFilter,
  type AuditValues,
} from "@/features/audit/types";
import { permissionLabel } from "@/features/auth/permissions";
import { useApi } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useLocale, useT } from "@/i18n";
import { formatDateTime } from "@/lib/format";

const KEYS = ["from", "to", "action", "entityType", "entityId", "actorEmail", "actorId", "page"] as const;
const PAGE_SIZE = 20;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const COLUMNS = 6;

type Messages = ReturnType<typeof useT>;

function actionLabel(action: string, t: Messages) {
  return (t.admin.audit.actions as Record<string, string>)[action] ?? action;
}

function entityLabel(type: string, t: Messages) {
  return (t.admin.audit.entity as Record<string, string>)[type] ?? type;
}

function fieldLabel(field: string, t: Messages) {
  return (t.admin.audit.fields as Record<string, string>)[field] ?? field;
}

function actionTone(action: string) {
  if (/DELETE|LOCK$|HIDE|CANCEL|REMOVE/.test(action) && action !== "USER_UNLOCK") return "danger";
  if (/CREATE|UNLOCK|SHOW|ASSIGN/.test(action)) return "success";
  return "info";
}

/** Audit log (SYS-04): read-only list of sensitive operations, filters kept in the URL, before / after per entry. */
export function AdminAuditLogsScreen() {
  const t = useT();
  const { intlLocale } = useLocale();
  const { values, set } = useUrlFilters(KEYS);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const invalidRange = Boolean(values.from && values.to && values.from > values.to);
  const filter: AuditLogFilter = {
    from: values.from || undefined,
    to: values.to || undefined,
    action: (values.action || undefined) as AuditAction | undefined,
    entityType: (values.entityType || undefined) as AuditEntityType | undefined,
    entityId: values.entityId || undefined,
    actorEmail: values.actorEmail || undefined,
    actorId: Number(values.actorId) > 0 ? Number(values.actorId) : undefined,
    page: Number(values.page) || 0,
    size: PAGE_SIZE,
  };
  const logs = useApi(invalidRange ? null : `audit-logs:${JSON.stringify(filter)}`, () => auditApi.search(filter));
  const list = logs.data?.content ?? [];
  const filtered = KEYS.some((key) => key !== "page" && values[key]);

  function toggle(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-fg-muted">{t.admin.audit.subtitle}</p>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.audit.from}
            <input
              type="date"
              value={values.from}
              max={values.to || undefined}
              onChange={(e) => set({ from: e.target.value })}
              className={controlClasses({ size: "md", invalid: invalidRange })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.audit.to}
            <input
              type="date"
              value={values.to}
              min={values.from || undefined}
              onChange={(e) => set({ to: e.target.value })}
              className={controlClasses({ size: "md", invalid: invalidRange })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.audit.action}
            <Select value={values.action} onChange={(e) => set({ action: e.target.value })}>
              <option value="">{t.admin.audit.allActions}</option>
              {AUDIT_ENTITY_TYPES.map((type) => (
                <optgroup key={type} label={entityLabel(type, t)}>
                  {AUDIT_ACTIONS[type].map((action) => (
                    <option key={action} value={action}>
                      {actionLabel(action, t)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
            {t.admin.audit.target}
            <Select value={values.entityType} onChange={(e) => set({ entityType: e.target.value, entityId: "" })}>
              <option value="">{t.admin.audit.allTargets}</option>
              {AUDIT_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {entityLabel(type, t)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {/* Remount when the URL changes from elsewhere (history button, clear) so the inputs follow it. */}
        <TextFilters
          key={`${values.actorEmail}|${values.entityId}|${values.entityType}`}
          actorEmail={values.actorEmail}
          entityId={values.entityId}
          entityIdEnabled={Boolean(values.entityType)}
          onSubmit={(actorEmail, entityId) => set({ actorEmail, entityId, actorId: actorEmail ? "" : values.actorId })}
        />
        {(filtered || values.actorId) && (
          <div className="flex flex-wrap items-center gap-2">
            {values.actorId && (
              <Badge tone="accent">
                {t.admin.audit.actor}: #{values.actorId}
                <button
                  type="button"
                  aria-label={t.admin.audit.clear}
                  className="ml-1 cursor-pointer rounded-full hover:text-fg"
                  onClick={() => set({ actorId: "" })}
                >
                  <X aria-hidden className="size-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => set(Object.fromEntries(KEYS.map((key) => [key, ""])))}>
              <X aria-hidden className="size-4" />
              {t.admin.audit.clear}
            </Button>
          </div>
        )}

        {invalidRange ? (
          <Alert tone="error">{t.admin.audit.invalidRange}</Alert>
        ) : logs.error && !logs.data ? (
          <ErrorState error={logs.error} onRetry={logs.reload} />
        ) : logs.data && list.length === 0 ? (
          <EmptyState icon={FileClock} title={t.admin.audit.empty} description={t.admin.audit.emptyHint} />
        ) : (
          <Table className="min-w-[900px]">
            <thead>
              <tr>
                <Th className="w-10">
                  <span className="sr-only">{t.admin.audit.details}</span>
                </Th>
                <Th>{t.admin.audit.time}</Th>
                <Th>{t.admin.audit.actor}</Th>
                <Th>{t.admin.audit.action}</Th>
                <Th>{t.admin.audit.target}</Th>
                <Th>{t.admin.audit.ip}</Th>
              </tr>
            </thead>
            {!logs.data ? (
              <TableSkeleton columns={COLUMNS} />
            ) : (
              <tbody>
                {list.map((log) => {
                  const open = expanded.has(log.id);
                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-surface-2/50">
                        <Td>
                          <IconButton
                            label={open ? t.admin.audit.hideDetails : t.admin.audit.showDetails}
                            aria-expanded={open}
                            aria-controls={`audit-${log.id}`}
                            onClick={() => toggle(log.id)}
                          >
                            <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                          </IconButton>
                        </Td>
                        <Td className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt, intlLocale)}</Td>
                        <Td>
                          <Actor log={log} />
                        </Td>
                        <Td>
                          <Badge tone={actionTone(log.action)}>{actionLabel(log.action, t)}</Badge>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-fg">{entityLabel(log.entityType, t)}</span>
                            {log.entityId && <span className="font-mono text-xs text-fg-muted">#{log.entityId}</span>}
                            {log.entityId && (
                              <IconButton
                                label={t.admin.audit.history}
                                onClick={() => set({ entityType: log.entityType, entityId: log.entityId ?? "", action: "" })}
                              >
                                <History aria-hidden className="size-4" />
                              </IconButton>
                            )}
                          </div>
                        </Td>
                        <Td className="font-mono text-xs whitespace-nowrap">{log.ipAddress ?? "—"}</Td>
                      </tr>
                      {open && (
                        <tr id={`audit-${log.id}`} className="bg-surface-2/40">
                          <td colSpan={COLUMNS} className="border-b border-line px-4 py-4">
                            <Details log={log} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            )}
          </Table>
        )}
        {!invalidRange && logs.data && list.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-fg-muted">{t.admin.audit.total(logs.data.totalElements)}</p>
            <Pagination page={logs.data.page} totalPages={logs.data.totalPages} onChange={(page) => set({ page })} />
          </div>
        )}
      </Card>
    </div>
  );
}

function TextFilters({
  actorEmail,
  entityId,
  entityIdEnabled,
  onSubmit,
}: {
  actorEmail: string;
  entityId: string;
  entityIdEnabled: boolean;
  onSubmit: (actorEmail: string, entityId: string) => void;
}) {
  const t = useT();
  const [email, setEmail] = useState(actorEmail);
  const [id, setId] = useState(entityId);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(email.trim(), entityIdEnabled ? id.trim() : "");
  }

  return (
    <form role="search" onSubmit={submit} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
        {t.admin.audit.actorEmail}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          autoComplete="off"
          className={controlClasses({ size: "md" })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
        {t.admin.audit.targetId}
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={!entityIdEnabled}
          maxLength={50}
          autoComplete="off"
          className={`${controlClasses({ size: "md" })} font-mono disabled:opacity-50`}
        />
      </label>
      <Button type="submit" size="md">
        <Search aria-hidden className="size-4" />
        {t.common.search}
      </Button>
    </form>
  );
}

function Actor({ log }: { log: AuditLog }) {
  const t = useT();
  if (!log.actor) return <span className="font-semibold text-fg-muted">{t.admin.audit.system}</span>;
  return (
    <Link
      href={ROUTES.admin.userDetail(log.actor.id)}
      className="block min-w-0 rounded focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="block max-w-56 truncate font-bold text-fg hover:text-accent">
        {log.actor.fullName ?? t.admin.audit.unknownUser(log.actor.id)}
      </span>
      {log.actor.email && <span className="block max-w-56 truncate text-xs text-fg-muted">{log.actor.email}</span>}
    </Link>
  );
}

/** Before / after per changed field; permission lists show what was added and removed. */
function Details({ log }: { log: AuditLog }) {
  const t = useT();
  const toast = useToast();
  const before = log.oldValue ?? {};
  const after = log.newValue ?? {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const lists = fields.filter((f) => Array.isArray(before[f]) || Array.isArray(after[f]));
  const scalars = fields.filter((f) => !lists.includes(f));

  async function copyTrace(traceId: string) {
    try {
      await navigator.clipboard.writeText(traceId);
      toast.success(t.admin.audit.copied);
    } catch {
      // Clipboard denied: the id stays visible to select by hand
    }
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-xs font-bold text-fg-muted uppercase">{t.admin.audit.details}</p>
      {scalars.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold text-fg-muted">
                <th scope="col" className="w-48 border-b border-line py-2 pr-3">
                  {t.admin.audit.field}
                </th>
                <th scope="col" className="border-b border-line py-2 pr-3">
                  {t.admin.audit.before}
                </th>
                <th scope="col" className="border-b border-line py-2">
                  {t.admin.audit.after}
                </th>
              </tr>
            </thead>
            <tbody>
              {scalars.map((field) => (
                <tr key={field} className="align-top">
                  <th scope="row" className="border-b border-line py-2 pr-3 text-left font-semibold text-fg-2">
                    {fieldLabel(field, t)}
                  </th>
                  <td className="border-b border-line py-2 pr-3 break-words text-fg-muted">
                    <Value field={field} values={log.oldValue} />
                  </td>
                  <td className="border-b border-line py-2 break-words font-semibold text-fg">
                    <Value field={field} values={log.newValue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lists.map((field) => (
        <ListChange key={field} field={field} before={before[field]} after={after[field]} />
      ))}
      {fields.length === 0 && <p className="text-fg-muted">—</p>}
      {log.traceId && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-fg-muted">{t.admin.audit.traceId}</span>
          <code className="rounded bg-surface px-2 py-1 font-mono">{log.traceId}</code>
          <IconButton label={t.admin.audit.copyTrace} onClick={() => copyTrace(log.traceId!)}>
            <Copy aria-hidden className="size-4" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function ListChange({ field, before, after }: { field: string; before: unknown; after: unknown }) {
  const t = useT();
  const old = Array.isArray(before) ? before.map(String) : [];
  const now = Array.isArray(after) ? after.map(String) : [];
  const added = now.filter((v) => !old.includes(v));
  const removed = old.filter((v) => !now.includes(v));
  const label = (v: string) => (field === "permissions" ? permissionLabel(v, t) : v);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-fg-2">{fieldLabel(field, t)}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold text-success">
            + {t.admin.audit.added} ({added.length})
          </p>
          {added.length > 0 ? (
            <ul className="list-disc pl-5 font-medium text-fg-2">
              {added.map((v) => (
                <li key={v}>{label(v)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-subtle">—</p>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-danger">
            − {t.admin.audit.removed} ({removed.length})
          </p>
          {removed.length > 0 ? (
            <ul className="list-disc pl-5 font-medium text-fg-2">
              {removed.map((v) => (
                <li key={v}>{label(v)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-subtle">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** One stored value, readable: dates in Vietnam time, cinema ids as names, role codes as labels. */
function Value({ field, values }: { field: string; values: AuditValues | null }) {
  const t = useT();
  const { intlLocale } = useLocale();
  const { cinemas } = useAdminCinema();
  if (!values || !(field in values)) return <span className="text-fg-subtle">—</span>;
  const value = values[field];
  if (value === null || value === undefined || value === "") return <span className="text-fg-subtle">—</span>;
  if (typeof value === "boolean") return <>{value ? t.common.yes : t.common.no}</>;
  if (field === "cinemaId") return <>{cinemas.find((c) => c.id === Number(value))?.name ?? `#${String(value)}`}</>;
  if (field === "role") return <>{(t.roles as Record<string, string>)[String(value)] ?? String(value)}</>;
  if (field === "scopeType") return <>{(t.admin.roles.scopes as Record<string, string>)[String(value)] ?? String(value)}</>;
  if (typeof value === "string" && ISO_INSTANT.test(value)) return <>{formatDateTime(value, intlLocale)}</>;
  if (typeof value === "object") return <code className="text-xs">{JSON.stringify(value)}</code>;
  return <>{String(value)}</>;
}
