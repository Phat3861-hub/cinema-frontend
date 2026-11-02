import type { Metadata } from "next";
import { PosScreen } from "@/features/booking/components/pos/pos-screen";

export const metadata: Metadata = { title: "Bán vé tại quầy" };

export default function AdminPosPage() {
  return <PosScreen />;
}
