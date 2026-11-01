import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminShowtimesScreen } from "@/features/showtime/components/admin-showtimes-screen";

export const metadata: Metadata = { title: "Suất chiếu" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminCinemaShowtimesPage({ params }: PageProps<"/admin/cinemas/[cinemaId]/showtimes">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ cinemaId }) => (
        <AdminShowtimesScreen cinemaId={Number(cinemaId)} />
      ))}
    </Suspense>
  );
}
