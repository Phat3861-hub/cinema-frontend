import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminAuditLogsScreen } from "@/features/audit/components/admin-audit-logs-screen";

export const metadata: Metadata = { title: "Nhật ký thao tác" };

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminAuditLogsScreen />
    </Suspense>
  );
}
