import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata: Metadata = { title: "Thông báo" };

export default function NotificationsPage() {
  return <AccountScreen section="notifications" />;
}
