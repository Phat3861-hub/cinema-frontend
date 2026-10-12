import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Phim" };

export default function MoviesPage() {
  return (
    <PagePlaceholder title="Phim đang chiếu / sắp chiếu">
      Danh sách phim, tìm kiếm và lọc theo thể loại (MOV-01, MOV-02).
    </PagePlaceholder>
  );
}
