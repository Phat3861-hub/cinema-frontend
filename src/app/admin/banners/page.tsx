import type { Metadata } from "next";
import { AdminBannersScreen } from "@/features/promotion/components/admin-banners-screen";

export const metadata: Metadata = { title: "Banner" };

export default function AdminBannersPage() {
  return <AdminBannersScreen />;
}
