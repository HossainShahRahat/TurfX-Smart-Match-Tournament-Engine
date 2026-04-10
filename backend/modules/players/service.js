import { HTTP_STATUS } from "@/config/constants";
import {
  createPlayer,
  findPlayerById,
  listPlayers,
} from "@/repositories/player.repository";
import { createUser, findUserByUsername } from "@/repositories/user.repository";
import { hashPassword } from "@/utils/password";
import {
  buildPlayerProfileById,
  sanitizePlayerSummary,
} from "@/services/player-profile.service";
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
    userId:
      player.userId?._id?.toString?.() || player.userId?.toString?.() || null,
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
  const autoPw = payload.name.toLowerCase().replace(/\\s+/g, "");
  const username = autoPw;

  // Check existing user
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw createHttpError(
      `Player username \${username} already exists.`,
      HTTP_STATUS.CONFLICT,
    );
  }

  const hashedPassword = await hashPassword(autoPw);
  const user = await createUser({
    name: payload.name.trim(),
    username,
    password: hashedPassword,
    role: "player",
    turfId: null,
  });

  const player = await createPlayer({
    name: payload.name.trim(),
    userId: user._id,
    totalGoals: 0,
    totalMatches: 0,
    skillRating: 0,
    averagePeerRating: 0,
    peerRatingSum: 0,
    peerRatingCount: 0,
    manOfTheMatchCount: 0,
  });

  const sanitized = sanitizePlayer(player);
  sanitized.initialPassword = autoPw; // Inform creator of pw
  return sanitized;
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
