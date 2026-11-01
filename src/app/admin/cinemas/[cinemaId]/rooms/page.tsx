import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminRoomsScreen } from "@/features/cinema/components/admin-rooms-screen";

export const metadata: Metadata = { title: "Phòng chiếu" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminCinemaRoomsPage({ params }: PageProps<"/admin/cinemas/[cinemaId]/rooms">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ cinemaId }) => (
        <AdminRoomsScreen cinemaId={Number(cinemaId)} />
      ))}
    </Suspense>
  );
}
