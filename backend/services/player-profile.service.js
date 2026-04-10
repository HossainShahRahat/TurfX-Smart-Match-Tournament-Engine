import { MATCH_EVENT_TYPES, MATCH_STATUS } from "@/config/constants";
import { listEvents } from "@/repositories/event.repository";
import { listMatches } from "@/repositories/match.repository";
import { findPlayerById, findPlayerByUserId, listPlayers } from "@/repositories/player.repository";
import { listRatings } from "@/repositories/rating.repository";
import { createHttpError } from "@/utils/http-error";
import { HTTP_STATUS } from "@/config/constants";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function roundNumber(value) {
  return Number((value || 0).toFixed(2));
}

function getScore(match) {
  return {
    teamA: match?.score?.teamA || 0,
    teamB: match?.score?.teamB || 0,
  };
}

function getParticipants(match) {
  return [...(match.teamA || []), ...(match.teamB || [])];
}

function didPlayerPlay(match, playerId) {
  return getParticipants(match).some((entry) => normalizeId(entry) === String(playerId));
}

function getPlayerTeamKey(match, playerId) {
  if ((match.teamA || []).some((entry) => normalizeId(entry) === String(playerId))) {
    return "teamA";
  }

  if ((match.teamB || []).some((entry) => normalizeId(entry) === String(playerId))) {
    return "teamB";
  }

  return null;
}

function summarizeMatchForPlayer(match, playerId, events, ratings) {
  const score = getScore(match);
  const teamKey = getPlayerTeamKey(match, playerId);
  const playerGoals = events.filter(
    (event) =>
      normalizeId(event.playerId) === String(playerId) && event.type === MATCH_EVENT_TYPES.GOAL
  ).length;
  const playerCards = events.filter(
    (event) =>
      normalizeId(event.playerId) === String(playerId) &&
      [MATCH_EVENT_TYPES.YELLOW_CARD, MATCH_EVENT_TYPES.RED_CARD].includes(event.type)
  );
  const peerRatings = ratings.filter(
    (rating) => normalizeId(rating.ratedPlayerId) === String(playerId)
  );
  const averagePeerRating = peerRatings.length
    ? roundNumber(peerRatings.reduce((sum, rating) => sum + rating.score, 0) / peerRatings.length)
    : 0;

  let result = "draw";
  if (teamKey === "teamA") {
    result = score.teamA === score.teamB ? "draw" : score.teamA > score.teamB ? "win" : "loss";
  }
  if (teamKey === "teamB") {
    result = score.teamA === score.teamB ? "draw" : score.teamB > score.teamA ? "win" : "loss";
  }

  return {
    id: normalizeId(match),
    title: match.title,
    scheduledAt: match.scheduledAt,
    location: match.location,
    status: match.status,
    score,
    teamALabel: match.teamALabel,
    teamBLabel: match.teamBLabel,
    result,
    goals: playerGoals,
    averagePeerRating,
    cards: playerCards.length,
    manOfTheMatch: normalizeId(match.manOfTheMatchPlayerId) === String(playerId),
  };
}

export function sanitizePlayerSummary(player) {
  return {
    id: normalizeId(player),
    name: player.name,
    userId: normalizeId(player.userId),
    totalGoals: player.totalGoals || 0,
    totalMatches: player.totalMatches || 0,
    skillRating: roundNumber(player.skillRating || 0),
    averagePeerRating: roundNumber(player.averagePeerRating || 0),
    peerRatingCount: player.peerRatingCount || 0,
    manOfTheMatchCount: player.manOfTheMatchCount || 0,
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
  };
}

export async function buildPlayerProfileById(playerId) {
  const player = await findPlayerById(playerId, { populateUser: true, lean: true });

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  const matches = await listMatches(
    {
      $or: [{ teamA: playerId }, { teamB: playerId }],
    },
    {
      sort: { scheduledAt: -1, createdAt: -1 },
      populatePlayers: true,
      populateMotm: true,
      lean: true,
    }
  );

  const finishedMatches = matches.filter((match) => match.status === MATCH_STATUS.FINISHED);
  const matchIds = finishedMatches.map((match) => match._id);
  const [events, ratings] = await Promise.all([
    listEvents(
      { matchId: { $in: matchIds } },
      { sort: { minute: 1, createdAt: 1 }, populatePlayer: true, lean: true }
    ),
    listRatings(
      { matchId: { $in: matchIds } },
      { sort: { createdAt: -1 }, populatePlayers: true, lean: true }
    ),
  ]);

  const eventsByMatch = new Map();
  for (const event of events) {
    const key = normalizeId(event.matchId);
    const bucket = eventsByMatch.get(key) || [];
    bucket.push(event);
    eventsByMatch.set(key, bucket);
  }

  const ratingsByMatch = new Map();
  for (const rating of ratings) {
    const key = normalizeId(rating.matchId);
    const bucket = ratingsByMatch.get(key) || [];
    bucket.push(rating);
    ratingsByMatch.set(key, bucket);
  }

  const matchHistory = finishedMatches.map((match) =>
    summarizeMatchForPlayer(
      match,
      playerId,
      eventsByMatch.get(normalizeId(match)) || [],
      ratingsByMatch.get(normalizeId(match)) || []
    )
  );

  return {
    ...sanitizePlayerSummary(player),
    email: player.userId?.email || null,
    username: player.userId?.username || null,
    pastMatchRecords: matchHistory,
    recentPerformances: matchHistory.slice(0, 5),
  };
}

export async function buildPlayerProfileByUserId(userId) {
  const player = await findPlayerByUserId(userId, { lean: true });

  if (!player) {
    throw createHttpError("Player profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  return buildPlayerProfileById(player._id.toString());
}

export async function listPublicPlayers() {
  const players = await listPlayers({}, { sort: { skillRating: -1, totalGoals: -1 } });
  return players.map(sanitizePlayerSummary);
}

export async function getPendingRatingsForPlayer(playerId) {
  const matches = await listMatches(
    {
      status: MATCH_STATUS.FINISHED,
      $or: [{ teamA: playerId }, { teamB: playerId }],
    },
    {
      sort: { scheduledAt: -1, createdAt: -1 },
      populatePlayers: true,
      lean: true,
    }
  );

  if (!matches.length) {
    return [];
  }

  const matchIds = matches.map((match) => match._id);
  const ratings = await listRatings(
    {
      matchId: { $in: matchIds },
      raterPlayerId: playerId,
    },
    { lean: true }
  );

  const ratingsByMatch = new Map();
  for (const rating of ratings) {
    const key = normalizeId(rating.matchId);
    const bucket = ratingsByMatch.get(key) || new Set();
    bucket.add(normalizeId(rating.ratedPlayerId));
    ratingsByMatch.set(key, bucket);
  }

  return matches
    .map((match) => {
      const alreadyRated = ratingsByMatch.get(normalizeId(match)) || new Set();
      const opponentsAndTeammates = getParticipants(match)
        .filter((entry) => normalizeId(entry) !== String(playerId))
        .map((entry) => ({
          id: normalizeId(entry),
          name: entry.name,
          team:
            (match.teamA || []).some((candidate) => normalizeId(candidate) === normalizeId(entry))
              ? match.teamALabel
              : match.teamBLabel,
        }));

      const remaining = opponentsAndTeammates.filter(
        (entry) => !alreadyRated.has(entry.id)
      );

      if (!remaining.length) {
        return null;
      }

      return {
        id: normalizeId(match),
        title: match.title,
        scheduledAt: match.scheduledAt,
        location: match.location,
        score: getScore(match),
        teamALabel: match.teamALabel,
        teamBLabel: match.teamBLabel,
        remainingToRate: remaining,
      };
    })
    .filter(Boolean);
}
