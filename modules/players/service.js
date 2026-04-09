import { HTTP_STATUS } from "@/config/constants";
import {
  createPlayer,
  findPlayerById,
  listPlayers,
  updatePlayerStats,
} from "@/repositories/player.repository";
import {
  calculateSkillRating,
  recalculatePlayerSkill,
} from "@/services/skill.service";
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

export async function createPlayerProfile(payload) {
  const player = await createPlayer({
    name: payload.name.trim(),
    userId: payload.userId || null,
    totalGoals: 0,
    totalMatches: 0,
    skillRating: 0,
  });

  return sanitizePlayer(player);
}

export async function getAllPlayers() {
  const players = await listPlayers({}, { sort: { createdAt: -1 } });
  return players.map(sanitizePlayer);
}

export async function getPlayerById(id) {
  const player = await findPlayerById(id, { lean: true });

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  return sanitizePlayer(player);
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
