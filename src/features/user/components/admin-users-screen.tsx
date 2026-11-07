"use client";

import { ChevronRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select-field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny, roleLabel } from "@/features/auth/permissions";
import type { UserRole, UserStatus } from "@/features/auth/types";
import { rbacApi, userApi } from "@/features/user/api";
import type { UserFilter } from "@/features/user/types";
import { useApi } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useLocale, useT } from "@/i18n";
import { formatDate, formatDateTime } from "@/lib/format";

const KEYS = ["status", "keyword", "roleCode", "cinemaId", "page"] as const;
const STATUSES: UserStatus[] = ["ACTIVE", "PENDING", "LOCKED"];
const PAGE_SIZE = 20;
export const USER_STATUS_TONE = { ACTIVE: "success", PENDING: "warning", LOCKED: "danger" } as const;

/** User list (SYS-05, BankDash Transaction table): status tabs, search, role / cinema filters kept in the URL, paging. */
export function AdminUsersScreen() {
  const t = useT();
  const { intlLocale } = useLocale();
  const { user: me } = useSession();
  const { cinemas } = useAdminCinema();
  const { values, set } = useUrlFilters(KEYS);
  const [typed, setTyped] = useState(values.keyword);
  // The role list needs ROLE_MANAGE; without it the filter offers the built-in roles.
  const roles = useApi(hasAny(me, ["ROLE_MANAGE"]) ? "rbac:roles" : null, rbacApi.roles);
  const roleOptions = roles.data?.map((role) => ({ code: role.code, label: roleLabel(role, t) })) ??
    Object.entries(t.roles).map(([code, label]) => ({ code, label }));

  const filter: UserFilter = {
    status: (values.status || undefined) as UserStatus | undefined,
    keyword: values.keyword || undefined,
    roleCode: values.roleCode || undefined,
    cinemaId: values.cinemaId ? Number(values.cinemaId) : undefined,
    page: Number(values.page) || 0,
    size: PAGE_SIZE,
  };
  const users = useApi(`users:${JSON.stringify(filter)}`, () => userApi.list(filter));
  const list = users.data?.content ?? [];

  function cinemaName(id: number) {
    return cinemas.find((c) => c.id === id)?.name ?? `#${id}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-fg-muted">{t.admin.users.subtitle}</p>

      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <Tabs
          label={t.admin.common.status}
          value={values.status as UserStatus | ""}
          onChange={(status) => set({ status })}
          items={[
            { value: "", label: t.admin.users.allStatuses },
            ...STATUSES.map((status) => ({ value: status, label: t.userStatus[status] })),
          ]}
        />
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <form
            role="search"
            className="relative"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              set({ keyword: typed.trim() });
            }}
          >
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              aria-label={t.admin.users.searchPlaceholder}
              placeholder={t.admin.users.searchPlaceholder}
              maxLength={100}
              className="h-10 w-full rounded border border-line-strong bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </form>
          <Select aria-label={t.admin.users.role} value={values.roleCode} onChange={(event) => set({ roleCode: event.target.value })}>
            <option value="">{t.admin.users.allRoles}</option>
            {roleOptions.map((role) => (
              <option key={role.code} value={role.code}>
                {role.label}
              </option>
            ))}
          </Select>
          <Select aria-label={t.admin.users.cinema} value={values.cinemaId} onChange={(event) => set({ cinemaId: event.target.value })}>
            <option value="">{t.admin.users.allCinemas}</option>
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </Select>
        </div>

        {users.error && !users.data ? (
          <ErrorState error={users.error} onRetry={users.reload} />
        ) : users.data && list.length === 0 ? (
          <EmptyState icon={Users} title={t.admin.users.empty} description={t.admin.users.emptyHint} />
        ) : (
          <Table className="min-w-[960px]">
            <thead>
              <tr>
                <Th>{t.admin.users.colUser}</Th>
                <Th>{t.admin.users.phone}</Th>
                <Th>{t.admin.users.roles}</Th>
                <Th>{t.admin.common.status}</Th>
                <Th>{t.admin.users.lastLogin}</Th>
                <Th>{t.admin.users.createdAt}</Th>
                <Th className="w-10">
                  <span className="sr-only">{t.admin.common.actions}</span>
                </Th>
              </tr>
            </thead>
            {!users.data ? (
              <TableSkeleton columns={7} />
            ) : (
              <tbody>
                {list.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-2/50">
                    <Td>
                      <Link
                        href={ROUTES.admin.userDetail(user.id)}
                        className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Avatar user={user} />
                        <span className="min-w-0">
                          <span className="block max-w-56 truncate font-bold text-fg hover:text-accent">{user.fullName}</span>
                          <span className="block max-w-56 truncate text-xs text-fg-muted">{user.email}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{user.phone ?? "—"}</Td>
                    <Td>
                      <RoleChips roles={user.roles} cinemaName={cinemaName} />
                    </Td>
                    <Td>
                      <Badge tone={USER_STATUS_TONE[user.status]}>{t.userStatus[user.status]}</Badge>
                    </Td>
                    <Td className="text-xs whitespace-nowrap">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt, intlLocale) : <span className="text-fg-subtle">{t.admin.users.never}</span>}
                    </Td>
                    <Td className="text-xs whitespace-nowrap">{formatDate(user.createdAt, intlLocale)}</Td>
                    <Td className="text-right">
                      <Link
                        href={ROUTES.admin.userDetail(user.id)}
                        aria-label={t.admin.users.view(user.fullName)}
                        className="inline-flex size-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <ChevronRight aria-hidden className="size-4" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
        {users.data && list.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-fg-muted">{t.admin.users.total(users.data.totalElements)}</p>
            <Pagination page={users.data.page} totalPages={users.data.totalPages} onChange={(page) => set({ page })} />
          </div>
        )}
      </Card>
    </div>
  );
}

/** One chip per assignment; cinema roles show the cinema. */
function RoleChips({ roles, cinemaName }: { roles: UserRole[]; cinemaName: (id: number) => string }) {
  const t = useT();
  if (roles.length === 0) return <span className="text-fg-subtle">—</span>;
  return (
    <ul className="flex max-w-80 flex-wrap gap-1.5">
      {roles.map((role) => (
        <li key={role.id}>
          <Badge tone={role.scopeType === "GLOBAL" ? (role.roleCode === "CUSTOMER" ? "neutral" : "accent") : "info"}>
            {roleLabel(role, t)}
            {role.cinemaId != null && <span className="font-medium opacity-80">· {cinemaName(role.cinemaId)}</span>}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
