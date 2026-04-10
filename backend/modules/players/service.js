import { HTTP_STATUS } from "@/config/constants";
import {
  createPlayer,
  findPlayerById,
  listPlayers,
} from "@/repositories/player.repository";
import { buildPlayerProfileById, sanitizePlayerSummary } from "@/services/player-profile.service";
import {
  calculateSkillRating,
  recalculatePlayerSkill,
} from "@/services/skill.service";
import { createHttpError } from "@/utils/http-error";
import { updatePlayerPerformanceStats } from "@/services/player-performance.service";
import { updatePlayerStats } from "@/repositories/player.repository";

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

export async function createPlayerProfile(payload) {
  const player = await createPlayer({
    name: payload.name.trim(),
    userId: payload.userId || null,
    totalGoals: 0,
    totalMatches: 0,
    skillRating: 0,
    averagePeerRating: 0,
    peerRatingSum: 0,
    peerRatingCount: 0,
    manOfTheMatchCount: 0,
  });

  return sanitizePlayer(player);
}

export async function getAllPlayers() {
  const players = await listPlayers({}, { sort: { createdAt: -1 } });
  return players.map(sanitizePlayerSummary);
}

export async function getPlayerById(id) {
  return buildPlayerProfileById(id);
}

export async function recalculateAndPersistPlayerSkill(playerId) {
  const player = await findPlayerById(playerId);

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  const nextSkillRating = recalculatePlayerSkill(player);

  const updatedPlayer = await updatePlayerStats(playerId, {
    skillRating: nextSkillRating,
  });

  return sanitizePlayer(updatedPlayer);
}

export { updatePlayerPerformanceStats };
