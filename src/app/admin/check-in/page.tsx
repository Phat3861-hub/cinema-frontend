import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Check-in" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.checkIn" description="admin.soon.checkIn" />;
}
