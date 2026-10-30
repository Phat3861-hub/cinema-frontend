import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SessionProvider } from "@/features/auth/components/session-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "PNT Cinema – Đặt vé xem phim",
    template: "%s | PNT Cinema",
  },
  description: "Đặt vé xem phim online, chọn ghế realtime, thanh toán nhanh.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
