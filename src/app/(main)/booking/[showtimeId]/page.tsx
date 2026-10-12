import { Suspense } from "react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function BookingPage({ params }: PageProps<"/booking/[showtimeId]">) {
  return (
    <PagePlaceholder title="Chọn ghế">
      <Suspense fallback="Đang tải...">
        {params.then(({ showtimeId }) => (
          <>
            Suất chiếu #{showtimeId}: sơ đồ ghế realtime (WebSocket), giữ ghế 10 phút, chọn bắp nước,
            thanh toán (BOK-01 → BOK-05).
          </>
        ))}
      </Suspense>
    </PagePlaceholder>
  );
}
