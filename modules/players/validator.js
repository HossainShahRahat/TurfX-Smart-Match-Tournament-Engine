import mongoose from "mongoose";

import { HTTP_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parsePlayerRequestBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateCreatePlayerPayload(payload) {
  if (!payload?.name || typeof payload.name !== "string") {
    throw createHttpError("Player name is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (payload.userId && !mongoose.Types.ObjectId.isValid(payload.userId)) {
    throw createHttpError("Invalid userId provided.", HTTP_STATUS.BAD_REQUEST);
  }

  const forbiddenFields = ["skillRating", "totalGoals", "totalMatches"];
  const attemptedField = forbiddenFields.find((field) => field in payload);

  if (attemptedField) {
    throw createHttpError(
      `${attemptedField} cannot be set manually during player creation.`,
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validatePlayerId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError("Invalid player id.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateStatsUpdatePayload(stats) {
  const totalGoals = stats.totalGoals ?? 0;
  const totalMatches = stats.totalMatches ?? 0;

  if (totalGoals < 0 || totalMatches < 0) {
    throw createHttpError(
      "Player stats cannot be negative.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}
