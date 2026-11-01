import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Bán vé tại quầy" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.pos" description="admin.soon.pos" />;
}
