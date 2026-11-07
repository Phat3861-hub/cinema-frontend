"use client";

import { Building2, ChevronsUpDown, Menu as MenuIcon, ShieldOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { PreferenceControls } from "@/components/layout/preference-controls";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ROUTES } from "@/constants/routes";
import { useAdminCinema } from "@/features/admin/cinema-context";
import { activeItem, isItemActive, visibleMenu } from "@/features/admin/menu";
import { useSession } from "@/features/auth/components/session-provider";
import { NotificationBell } from "@/features/notification/components/notification-bell";
import { useT } from "@/i18n";

/**
 * BankDash frame with Ticketor colours: 250px sidebar (icons only on tablets, drawer on phones),
 * topbar with page title + cinema picker + preferences + avatar menu.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 bg-page">
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col border-r border-line bg-surface md:flex xl:w-[250px]">
        <div className="flex h-[88px] items-center justify-center px-6 xl:justify-start">
          <span className="xl:hidden">
            <Logo label="PNT Admin" href={ROUTES.admin.dashboard} compact />
          </span>
          <span className="hidden xl:inline">
            <Logo label="PNT Admin" href={ROUTES.admin.dashboard} />
          </span>
        </div>
        <Suspense fallback={null}>
          <SidebarNav collapsible />
        </Suspense>
      </aside>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="PNT Admin" side="left">
        <div onClick={(e) => (e.target as HTMLElement).closest("a") && setDrawerOpen(false)}>
          <Suspense fallback={null}>
            <div className="mb-4 px-3">
              <CinemaPicker className="flex" />
            </div>
            <SidebarNav />
          </Suspense>
        </div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 md:h-[88px]">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.nav.openMenu}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded text-fg-2 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent md:hidden"
          >
            <MenuIcon aria-hidden className="size-6" />
          </button>
          <Suspense fallback={<div className="flex-1" />}>
            <PageTitle />
          </Suspense>
          <Suspense fallback={null}>
            <CinemaPicker />
          </Suspense>
          <div className="hidden sm:block">
            <PreferenceControls />
          </div>
          <NotificationBell />
          <UserMenu area="admin" />
        </header>
        <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<LoadingState />}>
            <PermissionGate>{children}</PermissionGate>
          </Suspense>
        </main>
        <div className="border-t border-line px-4 py-3 sm:hidden">
          <PreferenceControls />
        </div>
      </div>
    </div>
  );
}

function SidebarNav({ collapsible = false }: { collapsible?: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const { user } = useSession();
  const groups = visibleMenu(user?.permissions ?? []);
  // Collapsed rail on tablets: labels become sr-only, group titles disappear.
  const label = collapsible ? "sr-only xl:not-sr-only" : "";

  return (
    <nav aria-label={t.admin.navLabel} className="flex-1 overflow-y-auto pb-6">
      {groups.map((group) => (
        <div key={group.key} className="mb-4">
          <p
            className={`mb-1 px-6 text-[11px] font-bold tracking-wider text-fg-subtle uppercase ${collapsible ? "hidden xl:block" : ""}`}
          >
            {t.admin.groups[group.key]}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isItemActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.key} className="relative">
                  {active && <span aria-hidden className="absolute inset-y-1 left-0 w-1.5 rounded-r-lg bg-primary" />}
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={t.admin.menu[item.key]}
                    className={
                      "mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors " +
                      "focus-visible:outline-2 focus-visible:outline-accent " +
                      (collapsible ? "justify-center xl:justify-start " : "") +
                      (active ? "bg-accent/10 text-accent" : "text-fg-muted hover:bg-surface-2 hover:text-fg")
                    }
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span className={`flex-1 truncate ${label}`}>{t.admin.menu[item.key]}</span>
                    {item.soon && (
                      <span className={collapsible ? "hidden xl:inline" : ""}>
                        <Badge tone="neutral" className="px-1.5 text-[10px]">
                          {t.common.soon}
                        </Badge>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** A page opened by URL that the menu would hide shows "no access" instead of a screen full of 403s. */
function PermissionGate({ children }: { children: ReactNode }) {
  const t = useT();
  const item = activeItem(usePathname());
  const { user } = useSession();
  const permissions = user?.permissions ?? [];
  const allowed = !item || item.permissions.length === 0 || item.permissions.some((p) => permissions.includes(p));
  if (allowed) return children;
  return <EmptyState icon={ShieldOff} title={t.admin.forbiddenTitle} description={t.admin.forbiddenText} />;
}

function PageTitle() {
  const t = useT();
  const item = activeItem(usePathname());
  return (
    <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:text-2xl md:text-h4">
      {item ? t.admin.menu[item.key] : t.admin.menu.dashboard}
    </h1>
  );
}

const CINEMA_PATH = /^\/admin\/cinemas\/(\d+)\/(rooms|staff|showtimes)/;

/** Topbar cinema switcher (`/cinemas/managed`). On a per-cinema page it swaps the cinema id in the URL. */
function CinemaPicker({ className = "hidden sm:flex" }: { className?: string }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { cinemas, selected, select, loading } = useAdminCinema();
  if (loading || cinemas.length === 0 || !selected) return null;

  const match = pathname.match(CINEMA_PATH);
  const current = match ? (cinemas.find((c) => c.id === Number(match[1])) ?? selected) : selected;

  if (cinemas.length === 1) {
    return (
      <span className={`${className} max-w-56 items-center gap-2 truncate rounded-lg border border-line px-3 py-2 text-sm font-semibold text-fg-2`}>
        <Building2 aria-hidden className="size-4 shrink-0" />
        <span className="truncate">{current.name}</span>
      </span>
    );
  }

  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">{t.admin.pickCinema}</span>
      <Building2 aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
      <select
        value={current.id}
        onChange={(e) => {
          const id = Number(e.target.value);
          select(id);
          if (match) router.push(pathname.replace(CINEMA_PATH, `/admin/cinemas/${id}/${match[2]}`));
        }}
        className="h-10 w-full max-w-64 cursor-pointer appearance-none truncate rounded-lg border border-line-strong bg-surface-2 pr-9 pl-9 text-sm font-semibold text-fg focus:border-accent focus:outline-none"
      >
        {cinemas.map((cinema) => (
          <option key={cinema.id} value={cinema.id}>
            {cinema.name}
            {cinema.status === "INACTIVE" ? ` (${t.cinema.statusLabel.INACTIVE})` : ""}
          </option>
        ))}
      </select>
      <ChevronsUpDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" />
    </label>
  );
}
