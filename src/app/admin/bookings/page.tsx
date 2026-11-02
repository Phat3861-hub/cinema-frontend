import type { Metadata } from "next";
import { AdminBookingsScreen } from "@/features/booking/components/admin-bookings-screen";

export const metadata: Metadata = { title: "Đặt vé" };

export default function AdminBookingsPage() {
  return <AdminBookingsScreen />;
}
