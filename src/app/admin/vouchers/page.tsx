import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Voucher" };

export default function Page() {
  return <PagePlaceholder title="admin.menu.vouchers" description="admin.soon.vouchers" />;
}
