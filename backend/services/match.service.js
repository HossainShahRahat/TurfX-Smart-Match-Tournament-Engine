import mongoose from "mongoose";

import {
  HTTP_STATUS,
  MATCH_EVENT_TYPES,
  MATCH_STATUS,
  USER_ROLES,
} from "@/config/constants";
import { createEvent, listEvents } from "@/repositories/event.repository";
import { createMatch, findMatchById, listMatches, updateMatch } from "@/repositories/match.repository";
import { findPlayerById } from "@/repositories/player.repository";
import { updatePlayerPerformanceStats } from "@/services/player-performance.service";
import {
  publishMatchEvent,
  publishMatchState,
  publishPlayerStatUpdate,
} from "@/services/match-realtime.publisher";
import { createHttpError } from "@/utils/http-error";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function sanitizeMatchPlayer(player) {
  return {
    id: normalizeId(player),
    name: player.name,
    totalGoals: player.totalGoals ?? 0,
    totalMatches: player.totalMatches ?? 0,
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

function sanitizeMatch(match, score, timeline) {
  return {
    id: normalizeId(match),
    teamA: (match.teamA || []).map(sanitizeMatchPlayer),
    teamB: (match.teamB || []).map(sanitizeMatchPlayer),
    status: match.status,
    createdBy: normalizeId(match.createdBy),
    tournamentId: normalizeId(match.tournamentId),
    tournamentStage: match.tournamentStage || null,
    tournamentRound: match.tournamentRound || null,
    tournamentGroup: match.tournamentGroup || null,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    score,
    timeline,
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

  const players = await Promise.all(
    uniquePlayerIds.map((playerId) => findPlayerById(playerId))
  );

  const missingPlayerId = players.findIndex((player) => !player);

  if (missingPlayerId !== -1) {
    throw createHttpError("One or more players do not exist.", HTTP_STATUS.BAD_REQUEST);
  }
}

export async function calculateScore(matchId) {
  const match = await findMatchById(matchId, { populatePlayers: true, lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const events = await listEvents(
    { matchId },
    { sort: { minute: 1, createdAt: 1 }, lean: true }
  );

  const teamLookup = buildTeamLookup(match);
  const score = { teamA: 0, teamB: 0 };

  for (const event of events) {
    if (event.type !== MATCH_EVENT_TYPES.GOAL) {
      continue;
    }

    const team = teamLookup.get(normalizeId(event.playerId));

    if (team === "teamA") {
      score.teamA += 1;
    }

    if (team === "teamB") {
      score.teamB += 1;
    }
  }

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
    teamA: payload.teamA,
    teamB: payload.teamB,
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
    lean: true,
  });

  return sanitizeMatch(hydratedMatch, { teamA: 0, teamB: 0 }, []);
}

export async function getAllMatches() {
  const matches = await listMatches(
    {},
    {
      sort: { createdAt: -1 },
      populatePlayers: true,
      populateCreator: true,
      lean: true,
    }
  );

  return Promise.all(
    matches.map(async (match) => {
      const score = await calculateScore(match._id);
      return sanitizeMatch(match, score, []);
    })
  );
}

export async function getMatchDetails(matchId) {
  const match = await findMatchById(matchId, {
    populatePlayers: true,
    populateCreator: true,
    lean: true,
  });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  const [score, timeline] = await Promise.all([
    calculateScore(matchId),
    getMatchTimeline(matchId),
  ]);

  return sanitizeMatch(match, score, timeline);
}

export async function addEventToMatch(payload) {
  const match = await findMatchById(payload.matchId, { populatePlayers: true, lean: true });

  if (!match) {
    throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (match.status !== MATCH_STATUS.LIVE) {
    throw createHttpError(
      "Events can only be added to live matches.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const teamLookup = buildTeamLookup(match);
  const team = teamLookup.get(payload.playerId.toString());

  if (!team) {
    throw createHttpError(
      "Player does not belong to this match.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  try {
    const event = await createEvent({
      matchId: payload.matchId,
      playerId: payload.playerId,
      type: payload.type,
      minute: payload.minute,
    });

    let updatedPlayer = null;

    if (payload.type === MATCH_EVENT_TYPES.GOAL) {
      const player = await findPlayerById(payload.playerId);

      updatedPlayer = await updatePlayerPerformanceStats(payload.playerId, {
        totalGoals: player.totalGoals + 1,
      });
    }

    const [score, timeline] = await Promise.all([
      calculateScore(payload.matchId),
      getMatchTimeline(payload.matchId),
    ]);

    const response = {
      event: timeline[timeline.length - 1] || sanitizeEvent(event, teamLookup),
      score,
      timeline,
      updatedPlayer,
    };

    publishMatchEvent({
      matchId: payload.matchId.toString(),
      playerId: payload.playerId.toString(),
      type: payload.type,
      minute: payload.minute,
      updatedScore: score,
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
      throw createHttpError(
        "Duplicate match event detected.",
        HTTP_STATUS.CONFLICT
      );
    }

    throw error;
  }
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
    [MATCH_STATUS.PENDING]: MATCH_STATUS.LIVE,
    [MATCH_STATUS.LIVE]: MATCH_STATUS.FINISHED,
  };

  if (validTransitions[currentStatus] !== nextStatus) {
    throw createHttpError(
      "Invalid match status transition.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (nextStatus === MATCH_STATUS.FINISHED) {
    const playerIds = [...match.teamA, ...match.teamB].map((playerId) =>
      playerId.toString()
    );

    await Promise.all(
      playerIds.map(async (playerId) => {
        const player = await findPlayerById(playerId);

        await updatePlayerPerformanceStats(playerId, {
          totalMatches: player.totalMatches + 1,
        });
      })
    );
  }

  const updatedMatch = await updateMatch(matchId, { status: nextStatus });
  const matchDetails = await getMatchDetails(updatedMatch._id);

  if (
    nextStatus === MATCH_STATUS.FINISHED &&
    match.tournamentId
  ) {
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
