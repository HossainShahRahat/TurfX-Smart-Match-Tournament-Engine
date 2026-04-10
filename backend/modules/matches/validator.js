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
  if (!payload?.title || typeof payload.title !== "string" || !payload.title.trim()) {
    throw createHttpError("title is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.scheduledAt || Number.isNaN(Date.parse(payload.scheduledAt))) {
    throw createHttpError("scheduledAt must be a valid date/time.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.location || typeof payload.location !== "string" || !payload.location.trim()) {
    throw createHttpError("location is required.", HTTP_STATUS.BAD_REQUEST);
  }

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

export function validateUpdateMatchPayload(payload) {
  if (payload.title !== undefined) {
    if (typeof payload.title !== "string" || !payload.title.trim()) {
      throw createHttpError("title must be a non-empty string.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (payload.scheduledAt !== undefined) {
    if (!payload.scheduledAt || Number.isNaN(Date.parse(payload.scheduledAt))) {
      throw createHttpError("scheduledAt must be a valid date/time.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (payload.location !== undefined) {
    if (typeof payload.location !== "string" || !payload.location.trim()) {
      throw createHttpError("location must be a non-empty string.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (payload.teamALabel !== undefined) {
    if (typeof payload.teamALabel !== "string" || !payload.teamALabel.trim()) {
      throw createHttpError("teamALabel must be a non-empty string.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (payload.teamBLabel !== undefined) {
    if (typeof payload.teamBLabel !== "string" || !payload.teamBLabel.trim()) {
      throw createHttpError("teamBLabel must be a non-empty string.", HTTP_STATUS.BAD_REQUEST);
    }
  }

  if (payload.teamA !== undefined || payload.teamB !== undefined) {
    if (!Array.isArray(payload.teamA) || !Array.isArray(payload.teamB)) {
      throw createHttpError(
        "teamA and teamB must both be arrays when updating teams.",
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

export function validateMatchScorePayload(payload) {
  if (!Number.isInteger(payload?.teamA) || payload.teamA < 0) {
    throw createHttpError("teamA score must be a non-negative integer.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!Number.isInteger(payload?.teamB) || payload.teamB < 0) {
    throw createHttpError("teamB score must be a non-negative integer.", HTTP_STATUS.BAD_REQUEST);
  }
}
