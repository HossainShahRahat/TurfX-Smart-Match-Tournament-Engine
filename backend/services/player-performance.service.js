import { HTTP_STATUS } from "@/config/constants";
import { findPlayerById, updatePlayerStats } from "@/repositories/player.repository";
import { calculateSkillRating } from "@/services/skill.service";
import { createHttpError } from "@/utils/http-error";

function sanitizePlayer(player) {
  return {
    id: player._id.toString(),
    name: player.name,
    userId: player.userId?._id?.toString?.() || player.userId?.toString?.() || null,
    totalGoals: player.totalGoals,
    totalMatches: player.totalMatches,
    averagePeerRating: player.averagePeerRating || 0,
    peerRatingCount: player.peerRatingCount || 0,
    manOfTheMatchCount: player.manOfTheMatchCount || 0,
    skillRating: calculateSkillRating({
      totalGoals: player.totalGoals,
      totalMatches: player.totalMatches,
      averagePeerRating: player.averagePeerRating,
      peerRatingCount: player.peerRatingCount,
    }),
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
  };
}

export async function updatePlayerPerformanceStats(playerId, stats) {
  const player = await findPlayerById(playerId);

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  const nextTotalGoals = stats.totalGoals ?? player.totalGoals;
  const nextTotalMatches = stats.totalMatches ?? player.totalMatches;
  const nextAveragePeerRating = stats.averagePeerRating ?? player.averagePeerRating;
  const nextPeerRatingCount = stats.peerRatingCount ?? player.peerRatingCount;
  const nextSkillRating = calculateSkillRating({
    totalGoals: nextTotalGoals,
    totalMatches: nextTotalMatches,
    averagePeerRating: nextAveragePeerRating,
    peerRatingCount: nextPeerRatingCount,
  });

  const updatedPlayer = await updatePlayerStats(playerId, {
    totalGoals: nextTotalGoals,
    totalMatches: nextTotalMatches,
    averagePeerRating: nextAveragePeerRating,
    peerRatingSum: stats.peerRatingSum ?? player.peerRatingSum,
    peerRatingCount: nextPeerRatingCount,
    manOfTheMatchCount: stats.manOfTheMatchCount ?? player.manOfTheMatchCount,
    skillRating: nextSkillRating,
  });

  return sanitizePlayer(updatedPlayer);
}
