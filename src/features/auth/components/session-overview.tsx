"use client";

import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { hasAdminAccess, permissionLabel, roleLabel } from "@/features/auth/permissions";
import { useSession } from "@/features/auth/components/session-provider";
import type { UserStatus } from "@/features/auth/types";

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Chưa xác thực",
  LOCKED: "Đã khóa",
};

/**
 * Temporary landing content: shows who is signed in and with which roles / permissions, so each role's
 * login can be checked before the real pages exist. `area` only changes the wording and the shortcut link.
 */
export function SessionOverview({ area }: { area: "customer" | "admin" }) {
  const router = useRouter();
  const { status, user, logout } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  if (status === "loading") {
    return (
      <div role="status" className="flex items-center gap-3 text-neutral-300">
        <Spinner />
        <span className="text-sm font-medium">Đang kiểm tra phiên đăng nhập…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-neutral-200">Bạn chưa đăng nhập.</p>
        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.login} className={buttonClasses({ size: "md" })}>
            Đăng nhập
          </Link>
          <Link href={ROUTES.register} className={buttonClasses({ variant: "outline", size: "md" })}>
            Đăng ký
          </Link>
        </div>
      </div>
    );
  }

  const isStaff = hasAdminAccess(user);

  async function handleLogout() {
    setLoggingOut(true);
    await logout().catch(() => undefined);
    router.replace(ROUTES.login);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-700 bg-neutral-850 p-6 sm:flex-row sm:items-center">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-black">
          {isStaff ? <ShieldCheck aria-hidden className="size-7" /> : <UserRound aria-hidden className="size-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-h6 truncate">Xin chào, {user.fullName}</p>
          <p className="truncate text-sm font-medium text-neutral-300">{user.email}</p>
          <p className="mt-1 text-sm font-medium text-neutral-200">
            {isStaff ? "Tài khoản có quyền quản trị" : "Tài khoản khách hàng"} · Trạng thái:{" "}
            {STATUS_LABELS[user.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {area === "customer" && isStaff && (
            <Link href={ROUTES.admin.dashboard} className={buttonClasses({ size: "md" })}>
              Trang quản trị
            </Link>
          )}
          {area === "admin" && (
            <Link href={ROUTES.home} className={buttonClasses({ variant: "outline", size: "md" })}>
              Về trang khách hàng
            </Link>
          )}
          <Button variant="outline" size="md" loading={loggingOut} onClick={handleLogout}>
            {!loggingOut && <LogOut aria-hidden className="size-4" />}
            Đăng xuất
          </Button>
        </div>
      </div>

      <section aria-labelledby="roles-heading">
        <h2 id="roles-heading" className="text-h8 mb-3">
          Vai trò ({user.roles.length})
        </h2>
        <ul className="flex flex-wrap gap-2">
          {user.roles.map((role) => (
            <li
              key={role.id}
              className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-white"
            >
              {roleLabel(role)}
              <span className="ml-1 text-xs text-neutral-300">
                ({role.roleCode}
                {role.scopeType === "CINEMA" ? ` · rạp #${role.cinemaId}` : " · toàn hệ thống"})
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="permissions-heading">
        <h2 id="permissions-heading" className="text-h8 mb-3">
          Quyền ({user.permissions.length})
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {user.permissions.map((code) => (
            <li key={code} className="rounded border border-neutral-700 px-3 py-2">
              <p className="text-sm font-medium text-white">{permissionLabel(code)}</p>
              <p className="text-xs font-semibold text-neutral-400">{code}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
