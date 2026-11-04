import type { Metadata } from "next";
import { ReportsScreen } from "@/features/report/components/reports-screen";

export const metadata: Metadata = { title: "Báo cáo" };

export default function AdminReportsPage() {
  return <ReportsScreen />;
}
