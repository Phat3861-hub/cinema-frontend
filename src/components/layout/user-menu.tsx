"use client";

import { LayoutDashboard, LogOut, Ticket, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { ROUTES } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAdminAccess } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/types";
import { useT } from "@/i18n";

/** "NT" from "Nguyễn Tấn Phát": first + last word initials. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ user, size = "md" }: { user: Pick<CurrentUser, "fullName">; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-black ${size === "lg" ? "size-12 text-base" : "size-9 text-sm"}`}
    >
      {initials(user.fullName)}
    </span>
  );
}

/** Avatar dropdown: account, tickets, admin area (staff only), sign out. `area` hides the link to where you are. */
export function UserMenu({ area }: { area: "customer" | "admin" }) {
  const t = useT();
  const router = useRouter();
  const { user, logout } = useSession();
  if (!user) return null;

  const items: MenuItem[] = [
    { kind: "link", href: ROUTES.account, label: t.nav.account, icon: <UserRound aria-hidden className="size-4" /> },
    { kind: "link", href: ROUTES.myTickets, label: t.nav.myTickets, icon: <Ticket aria-hidden className="size-4" /> },
  ];
  if (area === "customer" && hasAdminAccess(user)) {
    items.push({
      kind: "link",
      href: ROUTES.admin.dashboard,
      label: t.nav.admin,
      icon: <LayoutDashboard aria-hidden className="size-4" />,
    });
  }
  if (area === "admin") {
    items.unshift({
      kind: "link",
      href: ROUTES.home,
      label: t.nav.customerSite,
      icon: <LayoutDashboard aria-hidden className="size-4" />,
    });
  }
  items.push(
    { kind: "separator" },
    {
      kind: "button",
      danger: true,
      label: t.nav.logout,
      icon: <LogOut aria-hidden className="size-4" />,
      onSelect: async () => {
        await logout().catch(() => undefined);
        router.replace(ROUTES.login);
      },
    },
  );

  return (
    <Menu
      triggerLabel={t.nav.userMenu(user.fullName)}
      trigger={
        <>
          <Avatar user={user} />
          <span className="hidden max-w-36 truncate text-sm font-semibold text-fg lg:inline">{user.fullName}</span>
        </>
      }
      header={
        <>
          <p className="truncate text-sm font-bold text-fg">{user.fullName}</p>
          <p className="truncate text-xs font-medium text-fg-muted">{user.email}</p>
        </>
      }
      items={items}
    />
  );
}
