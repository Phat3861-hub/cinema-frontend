import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata: Metadata = { title: "Phim yêu thích" };

export default function FavoritesPage() {
  return <AccountScreen section="favorites" />;
}
