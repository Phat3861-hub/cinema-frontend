import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata: Metadata = { title: "Vé của tôi" };

export default function MyTicketsPage() {
  return <AccountScreen section="tickets" />;
}
