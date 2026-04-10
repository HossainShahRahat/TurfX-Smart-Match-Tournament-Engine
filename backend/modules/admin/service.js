import {
  getPlatformAnalytics,
  getPlayerAnalytics,
  getTurfAnalytics,
} from "@/modules/analytics/service";
import { listUsers } from "@/repositories/user.repository";

export async function getAdminStats() {
  return getPlatformAnalytics();
}

export async function getAdminUsers() {
  const users = await listUsers({}, { sort: { createdAt: -1 } });

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
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
  return getPlayerAnalytics(user.id);
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
