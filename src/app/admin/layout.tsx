import type { Metadata } from "next";
import { AdminCinemaProvider } from "@/features/admin/cinema-context";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminGuard } from "@/features/auth/components/admin-guard";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | PNT Admin" },
};

/** Back-office layout (ADMIN, CINEMA_MANAGER, CONTENT_MANAGER, TICKET_STAFF…); menus follow permissions. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminGuard>
      <AdminCinemaProvider>
        <AdminShell>{children}</AdminShell>
      </AdminCinemaProvider>
    </AdminGuard>
  );
}
