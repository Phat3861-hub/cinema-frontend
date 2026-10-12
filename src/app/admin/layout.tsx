import type { Metadata } from "next";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | PNT Admin" },
};

/** Back-office layout (ADMIN, CINEMA_MANAGER, CONTENT_MANAGER, TICKET_STAFF). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1">
      <AdminSidebar />
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">{children}</div>
    </div>
  );
}
