import { countUsers } from "@/repositories/user.repository";
import {
  countDocumentsByModel,
  findPlayerProfileByUserId,
  findTopPlayers,
} from "@/repositories/metrics.repository";

export async function getPlatformAnalytics() {
  const [totalUsers, activeUsers, totalMatchesPlayed, activeTournaments, topPlayers] =
    await Promise.all([
      countUsers(),
      countUsers(),
      countDocumentsByModel("Match"),
      countDocumentsByModel("Tournament", { status: "active" }),
      findTopPlayers(5),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalMatchesPlayed,
    activeTournaments,
    topPlayers,
    mostActiveTurfs: [],
  };
}

export async function getTurfAnalytics(turfId) {
  const [hostedMatches, hostedTournaments] = await Promise.all([
    countDocumentsByModel("Match", turfId ? { turfId } : {}),
    countDocumentsByModel("Tournament", turfId ? { turfId } : {}),
  ]);

  return {
    hostedMatches,
    hostedTournaments,
    activeBookings: 0,
    estimatedRevenue: 0,
    utilizationRate: 0,
  };
}

export async function getPlayerAnalytics(userId) {
  const profile = await findPlayerProfileByUserId(userId);

  return {
    profile,
    matchHistory: [],
    tournaments: [],
    rankingPosition: profile?.ranking || null,
  };
}
