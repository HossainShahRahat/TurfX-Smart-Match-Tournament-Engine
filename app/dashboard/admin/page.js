import DashboardShell from "@/components/dashboard/dashboard-shell";
import DataTable from "@/components/dashboard/data-table";
import StatCard from "@/components/dashboard/stat-card";
import {
  fetchDashboardApi,
  requireRoleForDashboard,
} from "@/modules/dashboard/service";

export default async function AdminDashboardPage() {
  await requireRoleForDashboard("admin");
  const [stats, users] = await Promise.all([
    fetchDashboardApi("/api/admin/stats"),
    fetchDashboardApi("/api/admin/users"),
  ]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Platform-wide visibility, user management, and operating metrics."
      role="admin"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          helper="All registered accounts across every role."
        />
        <StatCard
          label="Total Matches"
          value={stats.totalMatchesPlayed}
          helper="Counts live and completed match records."
        />
        <StatCard
          label="Active Tournaments"
          value={stats.activeTournaments}
          helper="Currently active tournament entities."
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers}
          helper="Future-ready metric for platform activity."
        />
      </div>

      <section id="users" className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="mt-2 text-sm text-slate-400">
            Admin-only overview of platform users with role segmentation.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "turfId", label: "Turf ID" },
          ]}
          rows={users}
          emptyMessage="No users found yet."
        />
      </section>

      <section id="matches" className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-xl font-semibold">Top Players</h3>
          <div className="mt-4 space-y-3">
            {stats.topPlayers.length ? (
              stats.topPlayers.map((player, index) => (
                <div
                  key={`${player._id || player.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{player.name || "Unknown Player"}</p>
                    <p className="text-sm text-slate-400">
                      Goals: {player.totalGoals || 0}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-brand-light">
                    {player.skillRating || 0}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Top player analytics will appear when player records exist.
              </p>
            )}
          </div>
        </div>

        <div
          id="settings"
          className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5"
        >
          <h3 className="text-xl font-semibold">Platform Settings</h3>
          <p className="mt-3 text-sm text-slate-400">
            Payment plans, usage limits, and feature gating can plug into this
            panel later without changing the dashboard contract.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
