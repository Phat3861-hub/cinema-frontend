import type { Metadata } from "next";
import { CinemaRedirect } from "@/features/admin/components/cinema-scope";

export const metadata: Metadata = { title: "Nhân sự" };

export default function AdminStaffPage() {
  return <CinemaRedirect section="staff" />;
}
