import type { Metadata } from "next";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminGuard } from "@/features/auth/components/admin-guard";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | PNT Admin" },
};

/** Back-office layout (ADMIN, CINEMA_MANAGER, CONTENT_MANAGER, TICKET_STAFF). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1">
      <AdminSidebar />
      {/* Dark for now; the light default + dark mode frame comes with the admin screens (docs/ui-design.md §5.1). */}
      <div className="flex flex-1 flex-col bg-neutral-850">
        <AdminGuard>{children}</AdminGuard>
      </div>
    </div>
  );
}
