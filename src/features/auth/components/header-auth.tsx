"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAdminAccess } from "@/features/auth/permissions";

/** Right side of the navbar: sign-in / sign-up buttons, or the signed-in user's name. */
export function HeaderAuth() {
  const { status, user } = useSession();

  if (status === "loading") {
    return <div aria-hidden className="h-10 w-40 animate-pulse rounded bg-neutral-800 motion-reduce:animate-none" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={ROUTES.login} className={buttonClasses({ variant: "ghost", size: "md" })}>
          Đăng nhập
        </Link>
        <Link href={ROUTES.register} className={buttonClasses({ size: "md" })}>
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasAdminAccess(user) && (
        <Link href={ROUTES.admin.dashboard} className={buttonClasses({ variant: "outline", size: "md" })}>
          Quản trị
        </Link>
      )}
      <span className="hidden max-w-40 truncate text-sm font-medium text-neutral-200 sm:inline">
        {user.fullName}
      </span>
    </div>
  );
}
