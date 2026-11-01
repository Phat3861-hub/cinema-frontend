import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Bắp nước" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.products" description="admin.soon.products" />;
}
