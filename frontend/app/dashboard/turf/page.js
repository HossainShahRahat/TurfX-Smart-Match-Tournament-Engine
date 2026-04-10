import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatCard from "@/components/dashboard/stat-card";
import {
  fetchDashboardApi,
  requireRoleForDashboard,
} from "@/modules/dashboard/service";

export default async function TurfDashboardPage() {
  await requireRoleForDashboard("turf_owner");
  const stats = await fetchDashboardApi("/api/turf/stats");

  return (
    <DashboardShell
      title="Turf Owner Dashboard"
      subtitle="Manage hosted matches, sessions, and future monetization tools."
      role="turf_owner"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hosted Matches"
          value={stats.hostedMatches}
          helper="Matches linked to this turf."
        />
        <StatCard
          label="Hosted Tournaments"
          value={stats.hostedTournaments}
          helper="Tournament operations for this turf."
        />
        <StatCard
          label="Active Bookings"
          value={stats.activeBookings}
          helper="Placeholder for booking engine integration."
        />
        <StatCard
          label="Estimated Revenue"
          value={`$${stats.estimatedRevenue}`}
          helper="Future-ready monetization metric."
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div id="sessions" className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-semibold">Turf Sessions</h2>
          <p className="mt-3 text-sm text-slate-400">
            Use `POST /api/turf/match` and `POST /api/turf/tournament` to create
            draft resources tied to the authenticated turf owner.
          </p>
        </div>

        <div
          id="tournaments"
          className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-2xl font-semibold">Usage & Monetization</h2>
          <p className="mt-3 text-sm text-slate-400">
            Usage limits, subscriptions, and premium tournament tools can slot
            into this layer without changing route permissions.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
