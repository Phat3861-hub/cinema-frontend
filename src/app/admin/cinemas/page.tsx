import type { Metadata } from "next";
import { AdminCinemasScreen } from "@/features/cinema/components/admin-cinemas-screen";

export const metadata: Metadata = { title: "Rạp" };

export default function AdminCinemasPage() {
  return <AdminCinemasScreen />;
}
