import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Suất chiếu" };

export default function AdminShowtimesPage() {
  return (
    <PagePlaceholder title="Quản lý suất chiếu">
      Tạo / sửa / hủy suất chiếu, tạo hàng loạt (SHO-01 → SHO-03).
    </PagePlaceholder>
  );
}
