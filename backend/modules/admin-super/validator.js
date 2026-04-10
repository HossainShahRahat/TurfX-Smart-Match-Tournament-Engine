import mongoose from "mongoose";

import { HTTP_STATUS, MATCH_STATUS, TOURNAMENT_STATUS, USER_ROLES } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export function parseJsonBody(request) {
  return request.json().catch(() => {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  });
}

export function validateObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(`Invalid ${label}.`, HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateUserRoleFilter(role) {
  if (!role) return;
  const allowed = Object.values(USER_ROLES);
  if (!allowed.includes(role)) {
    throw createHttpError("Invalid role filter.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateSuspendPayload(payload) {
  validateObjectId(payload?.userId, "userId");
  if (payload?.reason && String(payload.reason).trim().length > 200) {
    throw createHttpError("reason must be 200 characters or less.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateMatchForceStatusPayload(payload) {
  validateObjectId(payload?.matchId, "matchId");
  if (!payload?.status || !Object.values(MATCH_STATUS).includes(payload.status)) {
    throw createHttpError("Invalid match status.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateTournamentForceUpdatePayload(payload) {
  validateObjectId(payload?.tournamentId, "tournamentId");
  if (payload?.status && !Object.values(TOURNAMENT_STATUS).includes(payload.status)) {
    throw createHttpError("Invalid tournament status.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateDeletePostPayload(payload) {
  validateObjectId(payload?.postId, "postId");
}

export function validateDeleteCommentPayload(payload) {
  validateObjectId(payload?.commentId, "commentId");
}

export function validateUpsertSettingPayload(payload) {
  if (!payload?.key || typeof payload.key !== "string" || !payload.key.trim()) {
    throw createHttpError("key is required.", HTTP_STATUS.BAD_REQUEST);
  }
  if (payload.key.trim().length > 100) {
    throw createHttpError("key must be 100 characters or less.", HTTP_STATUS.BAD_REQUEST);
  }
  if (payload.value === undefined) {
    throw createHttpError("value is required.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateAdminCreatePlayerPayload(payload) {
  if (!payload?.name || typeof payload.name !== "string" || !payload.name.trim()) {
    throw createHttpError("Player name is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.email || typeof payload.email !== "string" || !payload.email.trim()) {
    throw createHttpError("Player email is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.username || typeof payload.username !== "string" || !payload.username.trim()) {
    throw createHttpError("Player username is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.password || typeof payload.password !== "string" || payload.password.length < 6) {
    throw createHttpError("Password must be at least 6 characters long.", HTTP_STATUS.BAD_REQUEST);
  }
}
