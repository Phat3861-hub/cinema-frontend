import type { Metadata } from "next";
import { AdminReviewsScreen } from "@/features/movie/components/admin-reviews-screen";

export const metadata: Metadata = { title: "Đánh giá" };

export default function AdminReviewsPage() {
  return <AdminReviewsScreen />;
}
