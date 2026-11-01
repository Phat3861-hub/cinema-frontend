import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminUserDetail } from "@/features/user/components/admin-user-detail";

export const metadata: Metadata = { title: "Người dùng" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminUserDetailPage({ params }: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ userId }) => (
        <AdminUserDetail userId={userId} />
      ))}
    </Suspense>
  );
}
