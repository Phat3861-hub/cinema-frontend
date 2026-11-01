import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { BookingScreen } from "@/features/booking/components/booking-screen";

export const metadata: Metadata = { title: "Đặt vé" };

export default function BookingPage({ params }: PageProps<"/booking/[showtimeId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ showtimeId }) => (
        <BookingScreen showtimeId={showtimeId} />
      ))}
    </Suspense>
  );
}
