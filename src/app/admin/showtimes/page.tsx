import type { Metadata } from "next";
import { CinemaRedirect } from "@/features/admin/components/cinema-scope";

export const metadata: Metadata = { title: "Suất chiếu" };

export default function AdminShowtimesPage() {
  return <CinemaRedirect section="showtimes" />;
}
