import mongoose from "mongoose";

import {
  HTTP_STATUS,
  TOURNAMENT_TYPES,
} from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parseTournamentRequestBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateTournamentId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError("Invalid tournament id.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateCreateTournamentPayload(payload) {
  if (!payload?.name || typeof payload.name !== "string") {
    throw createHttpError("Tournament name is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!Object.values(TOURNAMENT_TYPES).includes(payload?.type)) {
    throw createHttpError("Invalid tournament type.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!Array.isArray(payload?.teams) || !payload.teams.length) {
    throw createHttpError(
      "Tournament teams are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  for (const team of payload.teams) {
    if (!team?.name || !Array.isArray(team.playerIds) || !team.playerIds.length) {
      throw createHttpError(
        "Each tournament team must have a name and playerIds.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!team.playerIds.every((playerId) => mongoose.Types.ObjectId.isValid(playerId))) {
      throw createHttpError(
        "Each team playerId must be a valid id.",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }
}

export function validateGenerateTournamentPayload(payload) {
  if (!mongoose.Types.ObjectId.isValid(payload?.tournamentId)) {
    throw createHttpError("tournamentId is required.", HTTP_STATUS.BAD_REQUEST);
  }
}
