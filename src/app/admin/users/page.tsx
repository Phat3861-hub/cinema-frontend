import type { Metadata } from "next";
import { AdminUsersScreen } from "@/features/user/components/admin-users-screen";

export const metadata: Metadata = { title: "Người dùng" };

export default function AdminUsersPage() {
  return <AdminUsersScreen />;
}
