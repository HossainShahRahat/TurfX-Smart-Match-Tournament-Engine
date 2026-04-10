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
    skillRating: calculateSkillRating({
      totalGoals: player.totalGoals,
      totalMatches: player.totalMatches,
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
  const nextSkillRating = calculateSkillRating({
    totalGoals: nextTotalGoals,
    totalMatches: nextTotalMatches,
  });

  const updatedPlayer = await updatePlayerStats(playerId, {
    totalGoals: nextTotalGoals,
    totalMatches: nextTotalMatches,
    skillRating: nextSkillRating,
  });

  return sanitizePlayer(updatedPlayer);
}

