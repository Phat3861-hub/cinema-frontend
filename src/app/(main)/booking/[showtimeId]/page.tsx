import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { SeatSelectionScreen } from "@/features/booking/components/seat-selection-screen";

export const metadata: Metadata = { title: "Chọn ghế" };

export default function BookingPage({ params }: PageProps<"/booking/[showtimeId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ showtimeId }) => (
        <SeatSelectionScreen showtimeId={showtimeId} />
      ))}
    </Suspense>
  );
}
