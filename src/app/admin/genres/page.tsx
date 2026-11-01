import type { Metadata } from "next";
import { AdminGenresScreen } from "@/features/movie/components/admin-genres-screen";

export const metadata: Metadata = { title: "Thể loại" };

export default function AdminGenresPage() {
  return <AdminGenresScreen />;
}
