import { SessionOverview } from "@/features/auth/components/session-overview";

// Temporary blank dashboard: shows the signed-in staff account and its roles / permissions.
export default function AdminDashboardPage() {
  return (
    <section className="w-full px-4 py-10 sm:px-8">
      <h1 className="text-h4 mb-6">Dashboard</h1>
      <SessionOverview area="admin" />
    </section>
  );
}
