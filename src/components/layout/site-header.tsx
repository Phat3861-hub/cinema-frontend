"use client";

import { Bell, LayoutDashboard, LogOut, Menu as MenuIcon, Search, Ticket, UserRound } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { PreferenceControls } from "@/components/layout/preference-controls";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonClasses } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ROUTES } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAdminAccess } from "@/features/auth/permissions";
import { NotificationBell } from "@/features/notification/components/notification-bell";
import { useT, type Messages } from "@/i18n";

const PILL = "flex h-14 items-center rounded-lg border border-line bg-surface/85 backdrop-blur";

function navItems(t: Messages) {
  return [
    { href: ROUTES.home, label: t.nav.home },
    { href: ROUTES.movies, label: t.nav.movies },
    { href: ROUTES.cinemas, label: t.nav.cinemas },
    { href: ROUTES.offers, label: t.nav.offers },
  ];
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === ROUTES.home ? pathname === href : pathname.startsWith(href);
}

function NavLinks({ pathname, vertical = false }: { pathname: string | null; vertical?: boolean }) {
  const t = useT();
  return (
    <ul className={vertical ? "flex flex-col gap-1" : "flex items-center gap-1"}>
      {navItems(t).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                "block rounded px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent " +
                (active ? "bg-primary text-black" : "text-fg-2 hover:bg-surface-2 hover:text-fg")
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** usePathname suspends under dynamic routes (Cache Components), so it lives in its own leaf. */
function ActiveNavLinks(props: { vertical?: boolean }) {
  return <NavLinks pathname={usePathname()} {...props} />;
}

function SearchBox({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <Form action={ROUTES.movies} role="search" className={`relative ${className}`}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
      <input
        name="keyword"
        type="search"
        aria-label={t.nav.searchLabel}
        placeholder={t.nav.searchPlaceholder}
        className="h-10 w-full rounded border border-line bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
      />
    </Form>
  );
}

function AuthButtons({ fullWidth = false }: { fullWidth?: boolean }) {
  const t = useT();
  return (
    <div className={`flex gap-2 ${fullWidth ? "flex-col" : "items-center"}`}>
      <Link href={ROUTES.login} className={buttonClasses({ variant: fullWidth ? "outline" : "ghost", size: "md", fullWidth })}>
        {t.auth.login.submit}
      </Link>
      <Link href={ROUTES.register} className={buttonClasses({ size: "md", fullWidth })}>
        {t.auth.register.submit}
      </Link>
    </div>
  );
}

/** Ticketor navbar: two floating "pills" (logo + menu | search + account); hamburger drawer on mobile. */
export function SiteHeader() {
  const t = useT();
  const router = useRouter();
  const { status, user, logout } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 pb-2">
      <div className="mx-auto flex w-full max-w-[1232px] items-center justify-between gap-3">
        <div className={`${PILL} gap-6 px-4`}>
          <Logo />
          <nav aria-label={t.nav.main} className="hidden md:block">
            <Suspense fallback={<NavLinks pathname={null} />}>
              <ActiveNavLinks />
            </Suspense>
          </nav>
        </div>

        <div className={`${PILL} gap-2 px-2`}>
          <SearchBox className="hidden w-56 lg:block" />
          <div className="hidden sm:block">
            <PreferenceControls />
          </div>
          {status === "loading" ? (
            <div aria-hidden className="h-10 w-28 animate-pulse rounded bg-surface-3 motion-reduce:animate-none" />
          ) : user ? (
            <>
              <NotificationBell />
              <UserMenu area="customer" />
            </>
          ) : (
            <div className="hidden md:block">
              <AuthButtons />
            </div>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.nav.openMenu}
            aria-expanded={drawerOpen}
            className="flex size-10 cursor-pointer items-center justify-center rounded text-fg-2 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent md:hidden"
          >
            <MenuIcon aria-hidden className="size-6" />
          </button>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={close} title={t.nav.menu}>
        <div className="flex flex-col gap-6" onClick={(e) => (e.target as HTMLElement).closest("a") && close()}>
          <SearchBox />
          <nav aria-label={t.nav.main}>
            <Suspense fallback={<NavLinks pathname={null} vertical />}>
              <ActiveNavLinks vertical />
            </Suspense>
          </nav>
          {user ? (
            <ul className="flex flex-col gap-1 border-t border-line pt-4 text-sm font-semibold">
              <DrawerLink href={ROUTES.account} icon={UserRound} label={t.nav.account} />
              <DrawerLink href={ROUTES.myTickets} icon={Ticket} label={t.nav.myTickets} />
              <DrawerLink href={ROUTES.notifications} icon={Bell} label={t.nav.notifications} />
              {hasAdminAccess(user) && (
                <DrawerLink href={ROUTES.admin.dashboard} icon={LayoutDashboard} label={t.nav.admin} />
              )}
              <li>
                <button
                  type="button"
                  onClick={async () => {
                    close();
                    await logout().catch(() => undefined);
                    router.replace(ROUTES.login);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-danger hover:bg-danger/10"
                >
                  <LogOut aria-hidden className="size-4" />
                  {t.nav.logout}
                </button>
              </li>
            </ul>
          ) : (
            status !== "loading" && <AuthButtons fullWidth />
          )}
          <div className="border-t border-line pt-4">
            <PreferenceControls />
          </div>
        </div>
      </Drawer>
    </header>
  );
}

function DrawerLink({ href, icon: Icon, label }: { href: string; icon: typeof Ticket; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded px-3 py-2 text-fg-2 hover:bg-surface-2 hover:text-fg">
        <Icon aria-hidden className="size-4" />
        {label}
      </Link>
    </li>
  );
}
