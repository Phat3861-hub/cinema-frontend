import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminUsersScreen } from "@/features/user/components/admin-users-screen";

export const metadata: Metadata = { title: "Người dùng" };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminUsersScreen />
    </Suspense>
  );
}
