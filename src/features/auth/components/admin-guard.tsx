"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES, withQuery } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAdminAccess } from "@/features/auth/permissions";
import { useT } from "@/i18n";

/**
 * Keeps signed-out users and customers out of /admin (UX only – every admin API checks permissions itself).
 * Signed out → login with `?next=`; signed in without any admin permission → home.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const { status, user } = useSession();
  const allowed = hasAdminAccess(user);

  // window.location instead of usePathname(): the guard wraps the whole admin layout and must not block prerendering.
  useEffect(() => {
    if (status === "anonymous") router.replace(withQuery(ROUTES.login, { next: window.location.pathname }));
    else if (status === "authenticated" && !allowed) router.replace(ROUTES.home);
  }, [status, allowed, router]);

  if (!allowed) {
    return (
      <div role="status" className="flex min-h-screen flex-1 items-center justify-center gap-3 p-8 text-fg-muted">
        <Spinner />
        <span className="text-sm font-medium">{t.admin.checkingAccess}</span>
      </div>
    );
  }
  return children;
}
