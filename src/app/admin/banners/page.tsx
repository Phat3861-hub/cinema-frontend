import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Banner" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.banners" description="admin.soon.banners" />;
}
