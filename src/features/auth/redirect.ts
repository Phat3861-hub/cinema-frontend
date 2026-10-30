import { ROUTES } from "@/constants/routes";
import { hasAdminAccess } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/types";

/** Reads one value of a search param (Next gives `string | string[] | undefined`). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Only same-site relative paths are allowed as `?next=` (blocks open redirects like `//evil.com`). */
export function safeNextPath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined;
  return value;
}

/** Where to go after signing in: the requested page, else the admin area for staff, else home. */
export function afterLoginPath(user: CurrentUser, next: string | undefined): string {
  return next ?? (hasAdminAccess(user) ? ROUTES.admin.dashboard : ROUTES.home);
}
