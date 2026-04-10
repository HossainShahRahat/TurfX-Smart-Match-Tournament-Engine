import {
  getPlatformAnalytics,
  getTurfAnalytics,
} from "@/modules/analytics/service";
import { listUsers } from "@/repositories/user.repository";
import {
  buildPlayerProfileByUserId,
  getPendingRatingsForPlayer,
} from "@/services/player-profile.service";

export async function getAdminStats() {
  return getPlatformAnalytics();
}

export async function getAdminUsers() {
  const users = await listUsers({}, { sort: { createdAt: -1 } });

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username || null,
    role: user.role,
    turfId: user.turfId || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function getTurfStats(user) {
  return getTurfAnalytics(user.turfId || null);
}

export async function getPlayerDashboard(user) {
  const profile = await buildPlayerProfileByUserId(user.id);
  const pendingRatings = await getPendingRatingsForPlayer(profile.id);

  return {
    profile,
    matchHistory: profile.pastMatchRecords,
    recentPerformances: profile.recentPerformances,
    pendingRatings,
    rankingPosition: null,
  };
}

export async function createHostedMatch(user, payload) {
  return {
    createdBy: user.id,
    turfId: user.turfId || null,
    status: "draft",
    ...payload,
  };
}

export async function createHostedTournament(user, payload) {
  return {
    createdBy: user.id,
    turfId: user.turfId || null,
    status: "draft",
    ...payload,
  };
}
