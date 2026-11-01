import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Đánh giá" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.reviews" description="admin.soon.reviews" />;
}
