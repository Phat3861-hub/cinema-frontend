import type { Metadata } from "next";
import { AdminRolesScreen } from "@/features/user/components/admin-roles-screen";

export const metadata: Metadata = { title: "Vai trò & quyền" };

export default function AdminRolesPage() {
  return <AdminRolesScreen />;
}
