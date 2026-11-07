import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata: Metadata = { title: "Điểm thưởng" };

export default function PointsPage() {
  return <AccountScreen section="points" />;
}
