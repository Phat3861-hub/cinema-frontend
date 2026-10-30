"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES, withQuery } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAdminAccess } from "@/features/auth/permissions";

/**
 * Keeps signed-out users and customers out of /admin (UX only – every admin API checks permissions itself).
 * Signed out → login with `?next=`; signed in without any admin permission → home.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();
  const allowed = hasAdminAccess(user);

  useEffect(() => {
    if (status === "anonymous") router.replace(withQuery(ROUTES.login, { next: pathname }));
    else if (status === "authenticated" && !allowed) router.replace(ROUTES.home);
  }, [status, allowed, pathname, router]);

  if (!allowed) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center gap-3 p-8 text-neutral-400">
        <Spinner />
        <span className="text-sm font-medium">Đang kiểm tra quyền truy cập…</span>
      </div>
    );
  }
  return children;
}
