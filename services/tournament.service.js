import {
  HTTP_STATUS,
  MATCH_STATUS,
  TOURNAMENT_STATUS,
  TOURNAMENT_TYPES,
} from "@/config/constants";
import { createMatchRecord, getMatchDetails } from "@/services/match.service";
import { listMatches } from "@/repositories/match.repository";
import { findPlayerById } from "@/repositories/player.repository";
import {
  createTournament as createTournamentDocument,
  findTournamentById,
  listTournaments,
  updateTournament,
} from "@/repositories/tournament.repository";
import { createHttpError } from "@/utils/http-error";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function buildRosterSignature(playerIds = []) {
  return [...playerIds].map((playerId) => normalizeId(playerId)).sort().join(":");
}

function sanitizeTournamentTeam(team) {
  return {
    id: normalizeId(team),
    name: team.name,
    playerIds: (team.playerIds || []).map((playerId) => normalizeId(playerId)),
    group: team.group || null,
    seed: team.seed || null,
  };
}

function sanitizeRoundPairing(pairing) {
  return {
    id: normalizeId(pairing),
    matchId: normalizeId(pairing.matchId),
    homeTeamId: normalizeId(pairing.homeTeamId),
    awayTeamId: normalizeId(pairing.awayTeamId),
    winnerTeamId: normalizeId(pairing.winnerTeamId),
  };
}

function sanitizeTournament(tournament, extra = {}) {
  return {
    id: normalizeId(tournament),
    name: tournament.name,
    type: tournament.type,
    status: tournament.status,
    teams: (tournament.teams || []).map(sanitizeTournamentTeam),
    matches: (tournament.matches || []).map((matchId) => normalizeId(matchId)),
    createdBy: normalizeId(tournament.createdBy),
    rules: tournament.rules,
    stages: {
      leagueGenerated: tournament.stages?.leagueGenerated || false,
      knockoutGenerated: tournament.stages?.knockoutGenerated || false,
      rounds: (tournament.stages?.rounds || []).map((round) => ({
        id: normalizeId(round),
        key: round.key,
        name: round.name,
        stage: round.stage,
        roundNumber: round.roundNumber,
        pairings: (round.pairings || []).map(sanitizeRoundPairing),
      })),
    },
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    ...extra,
  };
}

function getDefaultRules(rules = {}) {
  return {
    winPoints: rules.winPoints ?? 3,
    drawPoints: rules.drawPoints ?? 1,
    lossPoints: rules.lossPoints ?? 0,
    qualifiersPerGroup: rules.qualifiersPerGroup ?? 2,
    tieBreakers: rules.tieBreakers ?? ["points", "goalDifference", "goalsFor"],
  };
}

async function ensurePlayersExist(teams) {
  const allPlayerIds = teams.flatMap((team) => team.playerIds || []);
  const uniqueIds = [...new Set(allPlayerIds.map((playerId) => playerId.toString()))];

  const players = await Promise.all(uniqueIds.map((playerId) => findPlayerById(playerId)));

  if (players.some((player) => !player)) {
    throw createHttpError("One or more tournament players do not exist.", HTTP_STATUS.BAD_REQUEST);
  }
}

function ensureValidTeams(teams, type) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw createHttpError(
      "A tournament requires at least two teams.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const playerAssignments = new Set();
  const rosterSignatures = new Set();

  for (const team of teams) {
    if (!team?.name || !Array.isArray(team.playerIds) || !team.playerIds.length) {
      throw createHttpError(
        "Each tournament team must include a name and at least one player.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const rosterSignature = buildRosterSignature(team.playerIds);

    if (rosterSignatures.has(rosterSignature)) {
      throw createHttpError(
        "Duplicate team rosters are not allowed in the same tournament.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    rosterSignatures.add(rosterSignature);

    for (const playerId of team.playerIds) {
      const normalized = normalizeId(playerId);

      if (playerAssignments.has(normalized)) {
        throw createHttpError(
          "A player cannot belong to multiple tournament teams.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      playerAssignments.add(normalized);
    }
  }

  if (type === TOURNAMENT_TYPES.HYBRID) {
    const groups = new Set(teams.map((team) => team.group).filter(Boolean));

    if (groups.size < 2 || teams.some((team) => !team.group)) {
      throw createHttpError(
        "Hybrid tournaments require groups for every team and at least two groups.",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }
}

function buildRoundRobinPairs(teams) {
  const pairs = [];

  for (let index = 0; index < teams.length; index += 1) {
    for (let opponentIndex = index + 1; opponentIndex < teams.length; opponentIndex += 1) {
      pairs.push([teams[index], teams[opponentIndex]]);
    }
  }

  return pairs;
}

function buildTournamentTeamMaps(tournament) {
  const teams = (tournament.teams || []).map(sanitizeTournamentTeam);
  const byId = new Map();
  const bySignature = new Map();

  for (const team of teams) {
    byId.set(team.id, team);
    bySignature.set(buildRosterSignature(team.playerIds), team);
  }

  return { teams, byId, bySignature };
}

function initializeStandingRow(team) {
  return {
    teamId: team.id,
    name: team.name,
    group: team.group || null,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function sortStandingsRows(rows, tieBreakers = []) {
  const orderedRows = [...rows];

  orderedRows.sort((left, right) => {
    const comparisonOrder = ["points", ...tieBreakers];

    for (const key of comparisonOrder) {
      if ((right[key] || 0) !== (left[key] || 0)) {
        return (right[key] || 0) - (left[key] || 0);
      }
    }

    return left.name.localeCompare(right.name);
  });

  return orderedRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

async function getTournamentMatchDetails(tournamentId, stageFilter = null) {
  const filter = {
    tournamentId,
  };

  if (stageFilter) {
    filter.tournamentStage = stageFilter;
  }

  const matches = await listMatches(filter, {
    sort: { createdAt: 1 },
    populatePlayers: true,
    lean: true,
  });

  return Promise.all(
    matches.map(async (match) => {
      const details = await getMatchDetails(match._id);

      return {
        ...details,
        tournamentStage: match.tournamentStage || null,
        tournamentRound: match.tournamentRound || null,
        tournamentGroup: match.tournamentGroup || null,
      };
    })
  );
}

function resolveMatchTeams(match, teamSignatureMap) {
  const teamA = teamSignatureMap.get(buildRosterSignature(match.teamA.map((player) => player.id)));
  const teamB = teamSignatureMap.get(buildRosterSignature(match.teamB.map((player) => player.id)));

  if (!teamA || !teamB) {
    return { teamA: null, teamB: null };
  }

  return { teamA, teamB };
}

function resolveKnockoutWinner(matchDetails, pairing, teamMaps) {
  if (!pairing.matchId) {
    return normalizeId(pairing.winnerTeamId);
  }

  const { teamA, teamB } = resolveMatchTeams(matchDetails, teamMaps.bySignature);

  if (!teamA || !teamB) {
    return null;
  }

  if (matchDetails.score.teamA > matchDetails.score.teamB) {
    return teamA.id;
  }

  if (matchDetails.score.teamB > matchDetails.score.teamA) {
    return teamB.id;
  }

  // Placeholder draw resolution for single elimination until penalties/admin decision is added.
  const homeSeed = teamA.seed || Number.MAX_SAFE_INTEGER;
  const awaySeed = teamB.seed || Number.MAX_SAFE_INTEGER;

  if (homeSeed !== awaySeed) {
    return homeSeed < awaySeed ? teamA.id : teamB.id;
  }

  return teamA.id;
}

function getRoundName(participantCount) {
  if (participantCount <= 2) {
    return "Final";
  }

  if (participantCount <= 4) {
    return "Semi Final";
  }

  if (participantCount <= 8) {
    return "Quarter Final";
  }

  return `Round of ${participantCount}`;
}

async function createKnockoutRound({
  tournament,
  teamIds,
  stage,
  roundNumber,
}) {
  const teamMaps = buildTournamentTeamMaps(tournament);
  const seededTeams = teamIds
    .map((teamId) => teamMaps.byId.get(normalizeId(teamId)))
    .filter(Boolean)
    .sort((left, right) => {
      const leftSeed = left.seed || Number.MAX_SAFE_INTEGER;
      const rightSeed = right.seed || Number.MAX_SAFE_INTEGER;

      if (leftSeed !== rightSeed) {
        return leftSeed - rightSeed;
      }

      return left.name.localeCompare(right.name);
    });

  const pairings = [];
  const createdMatchIds = [];
  const teamQueue = [...seededTeams];

  while (teamQueue.length) {
    const homeTeam = teamQueue.shift();
    const awayTeam = teamQueue.pop() || null;

    if (!awayTeam) {
      pairings.push({
        homeTeamId: homeTeam.id,
        awayTeamId: null,
        matchId: null,
        winnerTeamId: homeTeam.id,
      });
      continue;
    }

    const match = await createMatchRecord(
      {
        teamA: homeTeam.playerIds,
        teamB: awayTeam.playerIds,
        tournamentId: tournament._id.toString(),
        tournamentStage: stage,
        tournamentRound: roundNumber,
        tournamentGroup: null,
      },
      {
        id: normalizeId(tournament.createdBy),
      }
    );

    createdMatchIds.push(match.id);
    pairings.push({
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      matchId: match.id,
      winnerTeamId: null,
    });
  }

  return {
    round: {
      key: `${stage}-${roundNumber}`,
      name: getRoundName(teamIds.length),
      stage,
      roundNumber,
      pairings,
    },
    createdMatchIds,
  };
}

async function generateHybridQualifiedTeams(tournament) {
  const standings = await calculateStandings(tournament._id.toString());
  const qualifiersPerGroup = tournament.rules?.qualifiersPerGroup || 2;
  const groups = standings.groups || [];
  const qualifiedTeams = [];

  for (const group of groups) {
    qualifiedTeams.push(...group.table.slice(0, qualifiersPerGroup));
  }

  if (qualifiedTeams.length < 2) {
    throw createHttpError(
      "Not enough qualified teams to generate the knockout stage.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const groupedByRank = new Map();

  for (const team of qualifiedTeams) {
    const bucket = groupedByRank.get(team.rank) || [];
    bucket.push(team);
    groupedByRank.set(team.rank, bucket);
  }

  const orderedQualifiedTeams = [...groupedByRank.keys()]
    .sort((left, right) => left - right)
    .flatMap((rank) =>
      groupedByRank.get(rank).sort((left, right) => left.group.localeCompare(right.group))
    );

  return orderedQualifiedTeams.map((team) => team.teamId);
}

export async function createTournament(payload, currentUser) {
  ensureValidTeams(payload.teams, payload.type);
  await ensurePlayersExist(payload.teams);

  const tournament = await createTournamentDocument({
    name: payload.name.trim(),
    type: payload.type,
    teams: payload.teams.map((team, index) => ({
      name: team.name.trim(),
      playerIds: team.playerIds,
      group: team.group || null,
      seed: team.seed || index + 1,
    })),
    matches: [],
    status: TOURNAMENT_STATUS.UPCOMING,
    createdBy: currentUser.id,
    rules: getDefaultRules(payload.rules),
    stages: {
      leagueGenerated: false,
      knockoutGenerated: false,
      rounds: [],
    },
  });

  return sanitizeTournament(tournament);
}

export async function listAllTournaments() {
  const tournaments = await listTournaments({}, { sort: { createdAt: -1 }, lean: true });
  return tournaments.map((tournament) => sanitizeTournament(tournament));
}

export async function calculateStandings(tournamentId) {
  const tournament = await findTournamentById(tournamentId, { lean: true });

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  const stageFilter =
    tournament.type === TOURNAMENT_TYPES.HYBRID ? "group" : "league";

  const matchDetails = await getTournamentMatchDetails(tournamentId, stageFilter);
  const teamMaps = buildTournamentTeamMaps(tournament);

  const tablesByGroup = new Map();

  for (const team of teamMaps.teams) {
    const groupKey = team.group || "overall";
    const table = tablesByGroup.get(groupKey) || new Map();
    table.set(team.id, initializeStandingRow(team));
    tablesByGroup.set(groupKey, table);
  }

  for (const match of matchDetails) {
    if (
      match.status !== MATCH_STATUS.LIVE &&
      match.status !== MATCH_STATUS.FINISHED
    ) {
      continue;
    }

    const { teamA, teamB } = resolveMatchTeams(match, teamMaps.bySignature);

    if (!teamA || !teamB) {
      continue;
    }

    const groupKey = teamA.group || "overall";
    const table = tablesByGroup.get(groupKey);

    if (!table) {
      continue;
    }

    const rowA = table.get(teamA.id);
    const rowB = table.get(teamB.id);

    rowA.played += 1;
    rowB.played += 1;
    rowA.goalsFor += match.score.teamA;
    rowA.goalsAgainst += match.score.teamB;
    rowB.goalsFor += match.score.teamB;
    rowB.goalsAgainst += match.score.teamA;
    rowA.goalDifference = rowA.goalsFor - rowA.goalsAgainst;
    rowB.goalDifference = rowB.goalsFor - rowB.goalsAgainst;

    if (match.score.teamA > match.score.teamB) {
      rowA.wins += 1;
      rowB.losses += 1;
      rowA.points += tournament.rules.winPoints;
      rowB.points += tournament.rules.lossPoints;
    } else if (match.score.teamB > match.score.teamA) {
      rowB.wins += 1;
      rowA.losses += 1;
      rowB.points += tournament.rules.winPoints;
      rowA.points += tournament.rules.lossPoints;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += tournament.rules.drawPoints;
      rowB.points += tournament.rules.drawPoints;
    }
  }

  const groups = [...tablesByGroup.entries()].map(([group, table]) => ({
    group: group === "overall" ? null : group,
    table: sortStandingsRows(
      [...table.values()],
      tournament.rules.tieBreakers || []
    ),
  }));

  return {
    tournamentId: tournamentId.toString(),
    groups,
  };
}

export async function generateLeagueMatches(tournamentId) {
  const tournament = await findTournamentById(tournamentId);

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (tournament.stages?.leagueGenerated) {
    throw createHttpError(
      "League/group fixtures have already been generated.",
      HTTP_STATUS.CONFLICT
    );
  }

  const groupedTeams = new Map();

  if (tournament.type === TOURNAMENT_TYPES.HYBRID) {
    for (const team of tournament.teams) {
      const groupKey = team.group;
      const currentTeams = groupedTeams.get(groupKey) || [];
      currentTeams.push(team);
      groupedTeams.set(groupKey, currentTeams);
    }
  } else {
    groupedTeams.set("league", tournament.teams);
  }

  const createdMatchIds = [];

  for (const [groupKey, teams] of groupedTeams.entries()) {
    const pairs = buildRoundRobinPairs(teams);

    for (const [homeTeam, awayTeam] of pairs) {
      const match = await createMatchRecord(
        {
          teamA: homeTeam.playerIds.map((playerId) => playerId.toString()),
          teamB: awayTeam.playerIds.map((playerId) => playerId.toString()),
          tournamentId,
          tournamentStage:
            tournament.type === TOURNAMENT_TYPES.HYBRID ? "group" : "league",
          tournamentRound: 1,
          tournamentGroup:
            tournament.type === TOURNAMENT_TYPES.HYBRID ? groupKey : null,
        },
        {
          id: normalizeId(tournament.createdBy),
        }
      );

      createdMatchIds.push(match.id);
    }
  }

  const updatedTournament = await updateTournament(tournamentId, {
    matches: [...tournament.matches.map((matchId) => matchId.toString()), ...createdMatchIds],
    status: TOURNAMENT_STATUS.ACTIVE,
    stages: {
      ...tournament.stages,
      leagueGenerated: true,
    },
  });

  return getTournamentDetails(updatedTournament._id.toString());
}

export async function generateKnockoutBracket(tournamentId, teamIds = null) {
  const tournament = await findTournamentById(tournamentId);

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (tournament.stages?.knockoutGenerated) {
    throw createHttpError(
      "Knockout bracket has already been generated.",
      HTTP_STATUS.CONFLICT
    );
  }

  const initialTeamIds =
    teamIds || tournament.teams.map((team) => normalizeId(team._id));

  const { round, createdMatchIds } = await createKnockoutRound({
    tournament,
    teamIds: initialTeamIds,
    stage: tournament.type === TOURNAMENT_TYPES.KNOCKOUT ? "knockout" : "hybrid_knockout",
    roundNumber: 1,
  });

  const updatedTournament = await updateTournament(tournamentId, {
    matches: [...tournament.matches.map((matchId) => matchId.toString()), ...createdMatchIds],
    status: TOURNAMENT_STATUS.ACTIVE,
    stages: {
      ...tournament.stages,
      knockoutGenerated: true,
      rounds: [...(tournament.stages?.rounds || []), round],
    },
  });

  return getTournamentDetails(updatedTournament._id.toString());
}

export async function advanceTeams(tournamentId) {
  const tournament = await findTournamentById(tournamentId);

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (tournament.type === TOURNAMENT_TYPES.LEAGUE) {
    return tournament;
  }

  if (
    tournament.type === TOURNAMENT_TYPES.HYBRID &&
    tournament.stages?.leagueGenerated &&
    !tournament.stages?.knockoutGenerated
  ) {
    const groupMatches = await getTournamentMatchDetails(tournamentId, "group");
    const hasOpenGroupMatch = groupMatches.some(
      (match) => match.status !== MATCH_STATUS.FINISHED
    );

    if (!hasOpenGroupMatch) {
      const qualifiedTeamIds = await generateHybridQualifiedTeams(tournament.toObject());
      await generateKnockoutBracket(tournamentId, qualifiedTeamIds);
      return findTournamentById(tournamentId);
    }

    return tournament;
  }

  const rounds = [...(tournament.stages?.rounds || [])];

  if (!rounds.length) {
    return tournament;
  }

  const teamMaps = buildTournamentTeamMaps(tournament);
  let tournamentChanged = false;
  let newRound = null;
  let createdMatchIds = [];

  for (let index = 0; index < rounds.length; index += 1) {
    const round = rounds[index];
    let allResolved = true;

    for (let pairingIndex = 0; pairingIndex < round.pairings.length; pairingIndex += 1) {
      const pairing = round.pairings[pairingIndex];

      if (pairing.winnerTeamId) {
        continue;
      }

      if (!pairing.matchId) {
        allResolved = false;
        continue;
      }

      const matchDetails = await getMatchDetails(pairing.matchId.toString());

      if (matchDetails.status !== MATCH_STATUS.FINISHED) {
        allResolved = false;
        continue;
      }

      const winnerTeamId = resolveKnockoutWinner(matchDetails, pairing, teamMaps);

      if (!winnerTeamId) {
        allResolved = false;
        continue;
      }

      rounds[index].pairings[pairingIndex].winnerTeamId = winnerTeamId;
      tournamentChanged = true;
    }

    const currentRound = rounds[index];
    const currentRoundWinners = currentRound.pairings
      .map((pairing) => normalizeId(pairing.winnerTeamId))
      .filter(Boolean);

    if (allResolved && currentRoundWinners.length === 1 && index === rounds.length - 1) {
      const updatedTournament = await updateTournament(tournamentId, {
        status: TOURNAMENT_STATUS.COMPLETED,
        stages: {
          ...tournament.stages,
          rounds,
        },
      });

      return updatedTournament;
    }

    if (
      allResolved &&
      currentRoundWinners.length > 1 &&
      index === rounds.length - 1
    ) {
      const generated = await createKnockoutRound({
        tournament: {
          ...tournament.toObject(),
          stages: {
            ...tournament.stages.toObject(),
            rounds,
          },
        },
        teamIds: currentRoundWinners,
        stage: currentRound.stage,
        roundNumber: currentRound.roundNumber + 1,
      });

      newRound = generated.round;
      createdMatchIds = generated.createdMatchIds;
      tournamentChanged = true;
      break;
    }
  }

  if (!tournamentChanged) {
    return tournament;
  }

  const updatedTournament = await updateTournament(tournamentId, {
    matches: [...tournament.matches.map((matchId) => matchId.toString()), ...createdMatchIds],
    stages: {
      ...tournament.stages.toObject(),
      rounds: newRound ? [...rounds, newRound] : rounds,
    },
  });

  return updatedTournament;
}

export async function createTournamentFixtures(tournamentId) {
  const tournament = await findTournamentById(tournamentId, { lean: true });

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (tournament.type === TOURNAMENT_TYPES.LEAGUE) {
    return generateLeagueMatches(tournamentId);
  }

  if (tournament.type === TOURNAMENT_TYPES.KNOCKOUT) {
    return generateKnockoutBracket(tournamentId);
  }

  return generateLeagueMatches(tournamentId);
}

export async function getTournamentDetails(tournamentId) {
  let tournament = await findTournamentById(tournamentId, { lean: true });

  if (!tournament) {
    throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (tournament.type !== TOURNAMENT_TYPES.LEAGUE) {
    await advanceTeams(tournamentId);
    tournament = await findTournamentById(tournamentId, { lean: true });
  }

  const standings =
    tournament.type === TOURNAMENT_TYPES.KNOCKOUT
      ? { groups: [] }
      : await calculateStandings(tournamentId);

  const matches = await getTournamentMatchDetails(tournamentId);

  return sanitizeTournament(tournament, {
    standings,
    matchDetails: matches,
  });
}

export async function syncTournamentProgress(tournamentId) {
  return advanceTeams(tournamentId);
}
