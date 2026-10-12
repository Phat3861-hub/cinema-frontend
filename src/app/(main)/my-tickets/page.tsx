import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Vé của tôi" };

export default function MyTicketsPage() {
  return (
    <PagePlaceholder title="Vé của tôi">
      Lịch sử đặt vé, vé QR, hủy vé / yêu cầu hoàn tiền (BOK-07, BOK-08).
    </PagePlaceholder>
  );
}
