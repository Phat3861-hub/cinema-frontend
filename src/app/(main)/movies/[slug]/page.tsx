import { Suspense } from "react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

// Cache Components: don't await params at page level, so the page shell can still be prerendered.
export default function MovieDetailPage({ params }: PageProps<"/movies/[slug]">) {
  return (
    <PagePlaceholder title="Chi tiết phim">
      <Suspense fallback="Đang tải...">
        {params.then(({ slug }) => (
          <>Phim: {slug} – trailer, đánh giá, lịch chiếu theo rạp (MOV-03).</>
        ))}
      </Suspense>
    </PagePlaceholder>
  );
}
