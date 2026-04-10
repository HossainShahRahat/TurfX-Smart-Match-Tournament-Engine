import {
  HTTP_STATUS,
  MATCH_EVENT_TYPES,
  MATCH_STATUS,
  USER_ROLES,
} from "@/config/constants";
import { createEvent, listEvents } from "@/repositories/event.repository";
import { createMatch, findMatchById, listMatches, updateMatch } from "@/repositories/match.repository";
import { findPlayerById } from "@/repositories/player.repository";
import { listRatings } from "@/repositories/rating.repository";
import { updatePlayerPerformanceStats } from "@/services/player-performance.service";
import { refreshMatchAwards } from "@/services/rating.service";
import {
  publishMatchEvent,
  publishMatchState,
  publishPlayerStatUpdate,
} from "@/services/match-realtime.publisher";
import { createHttpError } from "@/utils/http-error";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function roundNumber(value) {
  return Number((value || 0).toFixed(2));
}

function sanitizeMatchPlayer(player) {
  return {
    id: normalizeId(player),
    name: player.name,
    totalGoals: player.totalGoals ?? 0,
    totalMatches: player.totalMatches ?? 0,
    averagePeerRating: player.averagePeerRating ?? 0,
    peerRatingCount: player.peerRatingCount ?? 0,
    manOfTheMatchCount: player.manOfTheMatchCount ?? 0,
    skillRating: player.skillRating ?? 0,
  };
}

function sanitizeEvent(event, teamSideLookup) {
  const playerId = normalizeId(event.playerId);

  return {
    id: normalizeId(event),
    matchId: normalizeId(event.matchId),
    playerId,
    playerName: event.playerId?.name || null,
    team: teamSideLookup.get(playerId) || null,
    type: event.type,
    minute: event.minute,
    createdAt: event.createdAt,
  };
}

function sanitizeRating(rating) {
  return {
    id: normalizeId(rating),
    matchId: normalizeId(rating.matchId),
    raterPlayerId: normalizeId(rating.raterPlayerId),
    raterName: rating.raterPlayerId?.name || null,
    ratedPlayerId: normalizeId(rating.ratedPlayerId),
    ratedPlayerName: rating.ratedPlayerId?.name || null,
    score: rating.score,
    note: rating.note || null,
    createdAt: rating.createdAt,
  };
}

function getStoredScore(match) {
  return {
    teamA: match?.score?.teamA || 0,
    teamB: match?.score?.teamB || 0,
  };
}

function getParticipantIds(match) {
  return [...(match.teamA || []), ...(match.teamB || [])].map((player) =>
    normalizeId(player)
  );
}

function sanitizeMatch(match, score, timeline, ratings = []) {
  return {
    id: normalizeId(match),
    title: match.title,
    scheduledAt: match.scheduledAt,
    location: match.location,
    teamALabel: match.teamALabel || "Team A",
    teamBLabel: match.teamBLabel || "Team B",
    teamA: (match.teamA || []).map(sanitizeMatchPlayer),
    teamB: (match.teamB || []).map(sanitizeMatchPlayer),
    status: match.status,
    createdBy: normalizeId(match.createdBy),
    tournamentId: normalizeId(match.tournamentId),
    tournamentStage: match.tournamentStage || null,
    tournamentRound: match.tournamentRound || null,
    tournamentGroup: match.tournamentGroup || null,
    manOfTheMatch: match.manOfTheMatchPlayerId
      ? {
          id: normalizeId(match.manOfTheMatchPlayerId),
          name: match.manOfTheMatchPlayerId.name || null,
          reason: match.manOfTheMatchReason || null,
        }
      : null,
    completedAt: match.completedAt || null,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    score,
    timeline,
    ratings,
    ratingsCount: ratings.length,
  };
}

function buildTeamLookup(match) {
  const lookup = new Map();

  for (const player of match.teamA || []) {
    lookup.set(normalizeId(player), "teamA");
  }

  for (const player of match.teamB || []) {
    lookup.set(normalizeId(player), "teamB");
  }

  return lookup;
}

function ensureValidTeams(teamA, teamB) {
  if (!Array.isArray(teamA) || !Array.isArray(teamB) || !teamA.length || !teamB.length) {
    throw createHttpError(
      "teamA and teamB must both contain at least one player.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const allIds = [...teamA, ...teamB].map((id) => id.toString());
  const uniqueIds = new Set(allIds);

  if (allIds.length !== uniqueIds.size) {
    throw createHttpError(
      "A player cannot be assigned to both teams or duplicated in the same match.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

async function ensurePlayersExist(playerIds) {
  const uniquePlayerIds = [...new Set(playerIds.map((id) => id.toString()))];
  const players = await Promise.all(uniquePlayerIds.map((playerId) => findPlayerById(playerId)));
  const missingPlayerId = players.findIndex((player) => !player);

  if (missingPlayerId !== -1) {
    throw createHttpError("One or more players do not exist.", HTTP_STATUS.BAD_REQUEST);
  }
}

async function persistScore(matchId, score) {
  await updateMatch(matchId, { score });
  return score;
}

export async function calculateScore(matchId) {
  const match = await findMatchById(matchId, { lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (match.score && (match.score.teamA || match.score.teamB)) {
    return getStoredScore(match);
  }

  const fullMatch = await findMatchById(matchId, { populatePlayers: true, lean: true });
  const events = await listEvents(
    { matchId },
    { sort: { minute: 1, createdAt: 1 }, lean: true }
  );

  const teamLookup = buildTeamLookup(fullMatch);
  const score = { teamA: 0, teamB: 0 };

  for (const event of events) {
    if (event.type !== MATCH_EVENT_TYPES.GOAL) {
      continue;
    }

    const team = teamLookup.get(normalizeId(event.playerId));
    if (team === "teamA") score.teamA += 1;
    if (team === "teamB") score.teamB += 1;
  }

  await persistScore(matchId, score);
  return score;
}

export async function getMatchTimeline(matchId) {
  const match = await findMatchById(matchId, { populatePlayers: true, lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const events = await listEvents(
    { matchId },
    {
      sort: { minute: 1, createdAt: 1 },
      populatePlayer: true,
      lean: true,
    }
  );

  const teamLookup = buildTeamLookup(match);
  return events.map((event) => sanitizeEvent(event, teamLookup));
}

export async function createMatchRecord(payload, currentUser) {
  ensureValidTeams(payload.teamA, payload.teamB);
  await ensurePlayersExist([...payload.teamA, ...payload.teamB]);

  const match = await createMatch({
    title: payload.title.trim(),
    scheduledAt: payload.scheduledAt,
    location: payload.location.trim(),
    teamALabel: payload.teamALabel?.trim() || "Team A",
    teamBLabel: payload.teamBLabel?.trim() || "Team B",
    teamA: payload.teamA,
    teamB: payload.teamB,
    score: {
      teamA: 0,
      teamB: 0,
    },
    status: MATCH_STATUS.PENDING,
    createdBy: currentUser.id,
    tournamentId: payload.tournamentId || null,
    tournamentStage: payload.tournamentStage || null,
    tournamentRound: payload.tournamentRound || null,
    tournamentGroup: payload.tournamentGroup || null,
  });

  const hydratedMatch = await findMatchById(match._id, {
    populatePlayers: true,
    populateCreator: true,
    populateMotm: true,
    lean: true,
  });

  return sanitizeMatch(hydratedMatch, { teamA: 0, teamB: 0 }, [], []);
}

export async function updateMatchFixture(matchId, payload, currentUser) {
  const match = await findMatchById(matchId);

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const isAdmin = currentUser.role === USER_ROLES.ADMIN;
  const isCreator = normalizeId(match.createdBy) === currentUser.id;

  if (!isAdmin && !isCreator) {
    throw createHttpError(
      "Only the match creator or an admin can edit match details.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  if (match.status !== MATCH_STATUS.PENDING) {
    throw createHttpError(
      "Only pending matches can be edited.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const nextTeamA = payload.teamA ?? match.teamA.map((playerId) => normalizeId(playerId));
  const nextTeamB = payload.teamB ?? match.teamB.map((playerId) => normalizeId(playerId));

  ensureValidTeams(nextTeamA, nextTeamB);
  await ensurePlayersExist([...nextTeamA, ...nextTeamB]);

  const patch = {};

  if (payload.title !== undefined) patch.title = payload.title.trim();
  if (payload.scheduledAt !== undefined) patch.scheduledAt = payload.scheduledAt;
  if (payload.location !== undefined) patch.location = payload.location.trim();
  if (payload.teamALabel !== undefined) patch.teamALabel = payload.teamALabel.trim();
  if (payload.teamBLabel !== undefined) patch.teamBLabel = payload.teamBLabel.trim();
  if (payload.teamA !== undefined) patch.teamA = nextTeamA;
  if (payload.teamB !== undefined) patch.teamB = nextTeamB;

  await updateMatch(matchId, patch);
  return getMatchDetails(matchId);
}

export async function getAllMatches() {
  const matches = await listMatches(
    {},
    {
      sort: { scheduledAt: -1, createdAt: -1 },
      populatePlayers: true,
      populateCreator: true,
      populateMotm: true,
      lean: true,
    }
  );

  return Promise.all(
    matches.map(async (match) => {
      const ratings = await listRatings(
        { matchId: match._id },
        { sort: { createdAt: -1 }, populatePlayers: true, lean: true }
      );
      return sanitizeMatch(match, getStoredScore(match), [], ratings.map(sanitizeRating));
    })
  );
}

export async function getMatchDetails(matchId) {
  const match = await findMatchById(matchId, {
    populatePlayers: true,
    populateCreator: true,
    populateMotm: true,
    lean: true,
  });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const [score, timeline, ratings] = await Promise.all([
    calculateScore(matchId),
    getMatchTimeline(matchId),
    listRatings(
      { matchId },
      { sort: { createdAt: -1 }, populatePlayers: true, lean: true }
    ),
  ]);

  return sanitizeMatch(match, score, timeline, ratings.map(sanitizeRating));
}

export async function addEventToMatch(payload) {
  const match = await findMatchById(payload.matchId, { populatePlayers: true, lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (![MATCH_STATUS.LIVE, MATCH_STATUS.FINISHED].includes(match.status)) {
    throw createHttpError(
      "Events can only be added to live or completed matches.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const teamLookup = buildTeamLookup(match);
  const team = teamLookup.get(payload.playerId.toString());

  if (!team) {
    throw createHttpError("Player does not belong to this match.", HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const event = await createEvent({
      matchId: payload.matchId,
      playerId: payload.playerId,
      type: payload.type,
      minute: payload.minute,
    });

    let updatedPlayer = null;
    let nextScore = getStoredScore(match);

    if (payload.type === MATCH_EVENT_TYPES.GOAL) {
      const player = await findPlayerById(payload.playerId);

      updatedPlayer = await updatePlayerPerformanceStats(payload.playerId, {
        totalGoals: player.totalGoals + 1,
      });

      nextScore = {
        ...nextScore,
        [team]: (nextScore[team] || 0) + 1,
      };
      await persistScore(payload.matchId, nextScore);
    }

    const [timeline, refreshedMatch] = await Promise.all([
      getMatchTimeline(payload.matchId),
      findMatchById(payload.matchId, { populatePlayers: true, populateMotm: true, lean: true }),
    ]);

    if (refreshedMatch.status === MATCH_STATUS.FINISHED) {
      await refreshMatchAwards(payload.matchId);
    }

    const response = {
      event: timeline[timeline.length - 1] || sanitizeEvent(event, teamLookup),
      score: nextScore,
      timeline,
      updatedPlayer,
    };

    publishMatchEvent({
      matchId: payload.matchId.toString(),
      playerId: payload.playerId.toString(),
      type: payload.type,
      minute: payload.minute,
      updatedScore: nextScore,
      updatedTimeline: timeline,
      updatedPlayer,
      event: response.event,
    });

    if (updatedPlayer) {
      publishPlayerStatUpdate({
        matchId: payload.matchId.toString(),
        player: updatedPlayer,
      });
    }

    return response;
  } catch (error) {
    if (error?.code === 11000) {
      throw createHttpError("Duplicate match event detected.", HTTP_STATUS.CONFLICT);
    }

    throw error;
  }
}

export async function updateMatchScore(matchId, payload, currentUser) {
  const match = await findMatchById(matchId);

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const isAdmin = currentUser.role === USER_ROLES.ADMIN;
  const isCreator = normalizeId(match.createdBy) === currentUser.id;

  if (!isAdmin && !isCreator) {
    throw createHttpError("Only the match creator or an admin can update score.", HTTP_STATUS.FORBIDDEN);
  }

  const score = {
    teamA: payload.teamA,
    teamB: payload.teamB,
  };

  await persistScore(matchId, score);

  if (match.status === MATCH_STATUS.FINISHED) {
    await refreshMatchAwards(matchId);
  }

  return getMatchDetails(matchId);
}

export async function updateMatchStatus(matchId, nextStatus, currentUser) {
  const match = await findMatchById(matchId);

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const isAdmin = currentUser.role === USER_ROLES.ADMIN;
  const isCreator = normalizeId(match.createdBy) === currentUser.id;

  if (!isAdmin && !isCreator) {
    throw createHttpError(
      "Only the match creator or an admin can change match status.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  const currentStatus = match.status;
  const validTransitions = {
    [MATCH_STATUS.PENDING]: [MATCH_STATUS.LIVE, MATCH_STATUS.FINISHED],
    [MATCH_STATUS.LIVE]: [MATCH_STATUS.FINISHED],
    [MATCH_STATUS.FINISHED]: [],
  };

  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    throw createHttpError("Invalid match status transition.", HTTP_STATUS.BAD_REQUEST);
  }

  if (nextStatus === MATCH_STATUS.FINISHED) {
    const playerIds = getParticipantIds(match);

    await Promise.all(
      playerIds.map(async (playerId) => {
        const player = await findPlayerById(playerId);
        await updatePlayerPerformanceStats(playerId, {
          totalMatches: player.totalMatches + 1,
        });
      })
    );
  }

  const updatedMatch = await updateMatch(matchId, {
    status: nextStatus,
    completedAt: nextStatus === MATCH_STATUS.FINISHED ? new Date() : null,
  });

  if (nextStatus === MATCH_STATUS.FINISHED) {
    await refreshMatchAwards(matchId);
  }

  const matchDetails = await getMatchDetails(updatedMatch._id);

  if (nextStatus === MATCH_STATUS.FINISHED && match.tournamentId) {
    const { syncTournamentProgress } = await import("@/services/tournament.service");
    await syncTournamentProgress(match.tournamentId.toString());
  }

  publishMatchState({
    matchId: matchId.toString(),
    status: matchDetails.status,
    updatedScore: matchDetails.score,
    updatedTimeline: matchDetails.timeline,
    teamA: matchDetails.teamA,
    teamB: matchDetails.teamB,
  });

  return matchDetails;
}
