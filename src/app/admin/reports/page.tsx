import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Báo cáo" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.reports" description="admin.soon.reports" />;
}
