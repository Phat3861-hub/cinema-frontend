import type { Metadata } from "next";
import { AdminCinemaEditor } from "@/features/cinema/components/admin-cinema-form";

export const metadata: Metadata = { title: "Thêm rạp" };

export default function AdminCinemaNewPage() {
  return <AdminCinemaEditor />;
}
