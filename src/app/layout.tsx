import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { DEFAULT_LOCALE, DEFAULT_THEME, PREFERENCES_SCRIPT } from "@/lib/preferences";
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
    // The preferences script changes `lang` and the `dark` class before hydration.
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${manrope.variable} h-full antialiased ${DEFAULT_THEME === "dark" ? "dark" : ""}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
