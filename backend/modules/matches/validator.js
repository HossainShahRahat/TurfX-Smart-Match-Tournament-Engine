import mongoose from "mongoose";

import {
  HTTP_STATUS,
  MATCH_EVENT_TYPES,
  MATCH_STATUS,
} from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parseMatchRequestBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateMatchId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError("Invalid match id.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateCreateMatchPayload(payload) {
  if (!Array.isArray(payload?.teamA) || !Array.isArray(payload?.teamB)) {
    throw createHttpError(
      "teamA and teamB must be arrays of player ids.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const allIds = [...payload.teamA, ...payload.teamB];

  if (!allIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    throw createHttpError(
      "All team members must be valid player ids.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateAddEventPayload(payload) {
  if (!mongoose.Types.ObjectId.isValid(payload?.matchId)) {
    throw createHttpError("matchId is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(payload?.playerId)) {
    throw createHttpError("playerId is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!Object.values(MATCH_EVENT_TYPES).includes(payload?.type)) {
    throw createHttpError("Invalid event type.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!Number.isInteger(payload?.minute) || payload.minute < 0) {
    throw createHttpError(
      "minute must be a non-negative integer.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateMatchStatusPayload(payload) {
  if (!Object.values(MATCH_STATUS).includes(payload?.status)) {
    throw createHttpError("Invalid match status.", HTTP_STATUS.BAD_REQUEST);
  }
}
