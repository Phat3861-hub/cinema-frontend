import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.auditLogs" description="admin.soon.auditLogs" />;
}
