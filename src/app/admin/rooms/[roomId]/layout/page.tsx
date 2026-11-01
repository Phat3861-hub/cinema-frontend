import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { SeatLayoutScreen } from "@/features/cinema/components/seat-layout-designer";

export const metadata: Metadata = { title: "Sơ đồ ghế" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminRoomLayoutPage({ params }: PageProps<"/admin/rooms/[roomId]/layout">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ roomId }) => (
        <SeatLayoutScreen roomId={roomId} />
      ))}
    </Suspense>
  );
}
