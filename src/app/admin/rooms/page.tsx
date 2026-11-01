import type { Metadata } from "next";
import { CinemaRedirect } from "@/features/admin/components/cinema-scope";

export const metadata: Metadata = { title: "Phòng chiếu" };

export default function AdminRoomsPage() {
  return <CinemaRedirect section="rooms" />;
}
