import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Người dùng" };

export default function AdminUsersPage() {
  return (
    <PagePlaceholder title="Người dùng & phân quyền">
      Khóa / mở tài khoản, gán role, quản lý role & permission (AUTH-08, SYS-05).
    </PagePlaceholder>
  );
}
