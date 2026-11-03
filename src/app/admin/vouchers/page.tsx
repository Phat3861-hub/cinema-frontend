import type { Metadata } from "next";
import { AdminVouchersScreen } from "@/features/promotion/components/admin-vouchers-screen";

export const metadata: Metadata = { title: "Voucher" };

export default function AdminVouchersPage() {
  return <AdminVouchersScreen />;
}
