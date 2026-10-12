import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Rạp" };

export default function CinemasPage() {
  return (
    <PagePlaceholder title="Hệ thống rạp">
      Danh sách rạp theo thành phố, rạp gần bạn (CIN-01).
    </PagePlaceholder>
  );
}
