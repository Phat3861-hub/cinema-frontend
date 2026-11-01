import type { Metadata } from "next";
import { AdminSeatTypesScreen } from "@/features/cinema/components/admin-seat-types-screen";

export const metadata: Metadata = { title: "Loại ghế" };

export default function AdminSeatTypesPage() {
  return <AdminSeatTypesScreen />;
}
