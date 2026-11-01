import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminStaffScreen } from "@/features/cinema/components/admin-staff-screen";

export const metadata: Metadata = { title: "Nhân sự" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminCinemaStaffPage({ params }: PageProps<"/admin/cinemas/[cinemaId]/staff">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ cinemaId }) => (
        <AdminStaffScreen cinemaId={Number(cinemaId)} />
      ))}
    </Suspense>
  );
}
