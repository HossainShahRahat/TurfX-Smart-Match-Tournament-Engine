import { HTTP_STATUS, MATCH_EVENT_TYPES, MATCH_STATUS } from "@/config/constants";
import { listEvents } from "@/repositories/event.repository";
import { findMatchById, updateMatch } from "@/repositories/match.repository";
import { findPlayerById, updatePlayerStats } from "@/repositories/player.repository";
import { createRating, listRatings } from "@/repositories/rating.repository";
import { createHttpError } from "@/utils/http-error";
import { recalculatePlayerSkill } from "@/services/skill.service";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function roundNumber(value) {
  return Number((value || 0).toFixed(2));
}

function getParticipants(match) {
  return [...(match.teamA || []), ...(match.teamB || [])];
}

function isParticipant(match, playerId) {
  return getParticipants(match).some((entry) => normalizeId(entry) === String(playerId));
}

function getMatchTeamLookup(match) {
  const lookup = new Map();

  for (const player of match.teamA || []) {
    lookup.set(normalizeId(player), "teamA");
  }

  for (const player of match.teamB || []) {
    lookup.set(normalizeId(player), "teamB");
  }

  return lookup;
}

async function syncPlayerPeerAggregate(playerId) {
  const [player, ratings] = await Promise.all([
    findPlayerById(playerId),
    listRatings({ ratedPlayerId: playerId }, { lean: true }),
  ]);

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  const peerRatingSum = ratings.reduce((sum, rating) => sum + rating.score, 0);
  const peerRatingCount = ratings.length;
  const averagePeerRating = peerRatingCount ? peerRatingSum / peerRatingCount : 0;

  const updatedPlayer = await updatePlayerStats(playerId, {
    peerRatingSum,
    peerRatingCount,
    averagePeerRating: roundNumber(averagePeerRating),
    skillRating: recalculatePlayerSkill({
      ...player.toObject(),
      peerRatingSum,
      peerRatingCount,
      averagePeerRating,
    }),
  });

  return updatedPlayer;
}

function buildMotmCandidateMap(match, events, ratings) {
  const teamLookup = getMatchTeamLookup(match);
  const ratingBuckets = new Map();
  const candidates = new Map();

  for (const rating of ratings) {
    const key = normalizeId(rating.ratedPlayerId);
    const bucket = ratingBuckets.get(key) || [];
    bucket.push(rating.score);
    ratingBuckets.set(key, bucket);
  }

  for (const player of getParticipants(match)) {
    const playerId = normalizeId(player);
    const scores = ratingBuckets.get(playerId) || [];
    const avgRating = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    candidates.set(playerId, {
      playerId,
      team: teamLookup.get(playerId),
      score: avgRating * 1.5,
      avgRating,
      goals: 0,
      cards: 0,
    });
  }

  for (const event of events) {
    const playerId = normalizeId(event.playerId);
    const candidate = candidates.get(playerId);

    if (!candidate) {
      continue;
    }

    if (event.type === MATCH_EVENT_TYPES.GOAL) {
      candidate.goals += 1;
      candidate.score += 2.5;
    }

    if (event.type === MATCH_EVENT_TYPES.YELLOW_CARD) {
      candidate.cards += 1;
      candidate.score -= 0.5;
    }

    if (event.type === MATCH_EVENT_TYPES.RED_CARD) {
      candidate.cards += 1;
      candidate.score -= 1.5;
    }
  }

  return [...candidates.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.avgRating !== left.avgRating) {
      return right.avgRating - left.avgRating;
    }
    return right.goals - left.goals;
  });
}

export async function refreshMatchAwards(matchId) {
  const match = await findMatchById(matchId, {
    populatePlayers: true,
    populateMotm: true,
  });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const [events, ratings] = await Promise.all([
    listEvents({ matchId }, { lean: true }),
    listRatings({ matchId }, { lean: true }),
  ]);

  const rankedCandidates = buildMotmCandidateMap(match, events, ratings);
  const winner = rankedCandidates[0] || null;
  const previousMotmId = normalizeId(match.manOfTheMatchPlayerId);
  const nextMotmId = winner?.playerId || null;

  if (previousMotmId && previousMotmId !== nextMotmId) {
    const previousPlayer = await findPlayerById(previousMotmId);
    if (previousPlayer) {
      await updatePlayerStats(previousMotmId, {
        manOfTheMatchCount: Math.max((previousPlayer.manOfTheMatchCount || 1) - 1, 0),
      });
    }
  }

  if (nextMotmId && previousMotmId !== nextMotmId) {
    const nextPlayer = await findPlayerById(nextMotmId);
    if (nextPlayer) {
      await updatePlayerStats(nextMotmId, {
        manOfTheMatchCount: (nextPlayer.manOfTheMatchCount || 0) + 1,
      });
    }
  }

  const nextReason = winner
    ? `Goals: ${winner.goals}, peer rating: ${roundNumber(winner.avgRating)}`
    : null;

  await updateMatch(matchId, {
    manOfTheMatchPlayerId: nextMotmId,
    manOfTheMatchReason: nextReason,
  });

  return {
    manOfTheMatchPlayerId: nextMotmId,
    manOfTheMatchReason: nextReason,
  };
}

export async function submitMatchRatings(matchId, raterPlayerId, ratingsPayload) {
  const match = await findMatchById(matchId, { populatePlayers: true, lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (match.status !== MATCH_STATUS.FINISHED) {
    throw createHttpError(
      "Ratings can only be submitted after a match is completed.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!isParticipant(match, raterPlayerId)) {
    throw createHttpError(
      "Only players who participated in this match can submit ratings.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  if (!Array.isArray(ratingsPayload) || !ratingsPayload.length) {
    throw createHttpError("At least one rating is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const uniqueRatedIds = new Set();
  for (const entry of ratingsPayload) {
    if (!entry?.ratedPlayerId || !Number.isInteger(entry.score) || entry.score < 1 || entry.score > 10) {
      throw createHttpError("Each rating must include a valid player and a score from 1 to 10.", HTTP_STATUS.BAD_REQUEST);
    }

    if (String(entry.ratedPlayerId) === String(raterPlayerId)) {
      throw createHttpError("Players cannot rate themselves.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!isParticipant(match, entry.ratedPlayerId)) {
      throw createHttpError("Ratings can only target players who were in the match.", HTTP_STATUS.BAD_REQUEST);
    }

    if (uniqueRatedIds.has(String(entry.ratedPlayerId))) {
      throw createHttpError("Duplicate rated players are not allowed in one submission.", HTTP_STATUS.BAD_REQUEST);
    }

    uniqueRatedIds.add(String(entry.ratedPlayerId));
  }

  const existingRatings = await listRatings(
    {
      matchId,
      raterPlayerId,
      ratedPlayerId: { $in: [...uniqueRatedIds] },
    },
    { lean: true }
  );

  if (existingRatings.length > 0) {
    throw createHttpError(
      "Duplicate ratings from the same player for this match are not allowed.",
      HTTP_STATUS.CONFLICT
    );
  }

  const writtenRatings = [];
  try {
    for (const entry of ratingsPayload) {
      const created = await createRating({
        matchId,
        raterPlayerId,
        ratedPlayerId: entry.ratedPlayerId,
        score: entry.score,
        note: entry.note || null,
      });

      writtenRatings.push(created);
    }
  } catch (error) {
    if (error?.code === 11000) {
      throw createHttpError(
        "Duplicate ratings from the same player for this match are not allowed.",
        HTTP_STATUS.CONFLICT
      );
    }

    throw error;
  }

  const impactedPlayerIds = [...uniqueRatedIds];
  await Promise.all(impactedPlayerIds.map((playerId) => syncPlayerPeerAggregate(playerId)));
  await refreshMatchAwards(matchId);

  return writtenRatings.map((rating) => ({
    id: normalizeId(rating),
    matchId: normalizeId(rating.matchId),
    raterPlayerId: normalizeId(rating.raterPlayerId),
    ratedPlayerId: normalizeId(rating.ratedPlayerId),
    score: rating.score,
    note: rating.note || null,
    createdAt: rating.createdAt,
  }));
}
