import type { Metadata } from "next";
import { OffersScreen } from "@/features/promotion/components/offers-screen";

export const metadata: Metadata = { title: "Ưu đãi" };

export default function OffersPage() {
  return <OffersScreen />;
}
