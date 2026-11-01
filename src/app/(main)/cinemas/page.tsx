import type { Metadata } from "next";
import { CinemasScreen } from "@/features/cinema/components/cinemas-screen";

export const metadata: Metadata = { title: "Rạp chiếu" };

export default function CinemasPage() {
  return <CinemasScreen />;
}
