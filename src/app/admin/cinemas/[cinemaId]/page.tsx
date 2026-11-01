import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminCinemaEditor } from "@/features/cinema/components/admin-cinema-form";

export const metadata: Metadata = { title: "Sửa rạp" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminCinemaEditPage({ params }: PageProps<"/admin/cinemas/[cinemaId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ cinemaId }) => (
        <AdminCinemaEditor cinemaId={cinemaId} />
      ))}
    </Suspense>
  );
}
