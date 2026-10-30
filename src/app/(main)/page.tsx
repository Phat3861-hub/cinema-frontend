import { SessionOverview } from "@/features/auth/components/session-overview";

// Temporary blank home: shows the signed-in account and its roles until the real home page (docs/ui-design.md §4.3).
export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-[1232px] px-4 py-12">
      <h1 className="text-h4 mb-6">Trang chủ</h1>
      <SessionOverview area="customer" />
    </section>
  );
}
