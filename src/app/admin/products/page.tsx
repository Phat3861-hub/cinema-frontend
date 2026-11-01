import type { Metadata } from "next";
import { AdminProductsScreen } from "@/features/booking/components/admin-products-screen";

export const metadata: Metadata = { title: "Bắp nước" };

export default function AdminProductsPage() {
  return <AdminProductsScreen />;
}
