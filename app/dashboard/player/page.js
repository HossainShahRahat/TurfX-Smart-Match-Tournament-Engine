import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatCard from "@/components/dashboard/stat-card";
import {
  fetchDashboardApi,
  requireRoleForDashboard,
} from "@/modules/dashboard/service";

export default async function PlayerDashboardPage() {
  await requireRoleForDashboard("player");
  const data = await fetchDashboardApi("/api/player/dashboard");
  const profile = data.profile || {};

  return (
    <DashboardShell
      title="Player Dashboard"
      subtitle="Personal performance, match participation, and tournament visibility."
      role="player"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Skill Rating"
          value={profile.skillRating || 0}
          helper="Pulled from the player skill engine."
        />
        <StatCard
          label="Total Goals"
          value={profile.totalGoals || 0}
          helper="Career goals across tracked matches."
        />
        <StatCard
          label="Total Matches"
          value={profile.totalMatches || 0}
          helper="Completed appearances recorded in the system."
        />
        <StatCard
          label="Ranking Position"
          value={data.rankingPosition || "-"}
          helper="Future-ready ranking integration."
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div id="matches" className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-semibold">Match History</h2>
          <p className="mt-3 text-sm text-slate-400">
            Match history will render here once player-match linking is available.
          </p>
        </div>

        <div
          id="ranking"
          className="rounded-3xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-2xl font-semibold">Tournament Participation</h2>
          <p className="mt-3 text-sm text-slate-400">
            Tournament entries and ranking movement can reuse this dashboard
            contract later without changing the player route.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
