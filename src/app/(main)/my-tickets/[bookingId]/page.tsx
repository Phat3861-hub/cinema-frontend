import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata: Metadata = { title: "Vé điện tử" };

// Cache Components: params resolve inside Suspense.
export default function MyTicketPage({ params }: PageProps<"/my-tickets/[bookingId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ bookingId }) => (
        <AccountScreen section="tickets" bookingId={Number(bookingId)} />
      ))}
    </Suspense>
  );
}
