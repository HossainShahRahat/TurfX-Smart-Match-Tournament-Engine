import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatCard from "@/components/dashboard/stat-card";
import PlayerDashboardClient from "@/components/player/player-dashboard-client";
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
          label="Average Peer Rating"
          value={profile.averagePeerRating || 0}
          helper="Average score from other players after completed matches."
        />
        <StatCard
          label="Ranking Position"
          value={data.rankingPosition || "-"}
          helper="Future-ready ranking integration."
        />
      </div>

      <div className="mt-8">
        <PlayerDashboardClient initialData={data} />
      </div>
    </DashboardShell>
  );
}
