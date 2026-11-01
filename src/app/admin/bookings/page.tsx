import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Đặt vé" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.bookings" description="admin.soon.bookings" />;
}
