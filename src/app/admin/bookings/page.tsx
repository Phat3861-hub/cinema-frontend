import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Đặt vé" };

export default function AdminBookingsPage() {
  return (
    <PagePlaceholder title="Quản lý đặt vé">
      Tra cứu booking, duyệt hoàn tiền, POS bán vé tại quầy, check-in QR (BOK-09, BOK-10, PAY-03).
    </PagePlaceholder>
  );
}
