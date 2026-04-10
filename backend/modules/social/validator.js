import mongoose from "mongoose";

import { HTTP_STATUS, POST_TYPES, USER_ROLES } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parseSocialRequestBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validatePostPayload(payload) {
  if (!payload?.title || !payload?.content) {
    throw createHttpError("title and content are required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (payload.type && payload.type !== POST_TYPES.MANUAL_POST) {
    throw createHttpError(
      "Only manual posts can be created through this endpoint.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateCommentPayload(payload) {
  if (!mongoose.Types.ObjectId.isValid(payload?.postId)) {
    throw createHttpError("postId is required.", HTTP_STATUS.BAD_REQUEST);
  }

  if (!payload?.text || typeof payload.text !== "string") {
    throw createHttpError("Comment text is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const normalized = payload.text.trim();

  if (!normalized) {
    throw createHttpError("Comment text cannot be empty.", HTTP_STATUS.BAD_REQUEST);
  }

  if (normalized.length > 500) {
    throw createHttpError(
      "Comment text must be 500 characters or less.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateLikePayload(payload) {
  if (!mongoose.Types.ObjectId.isValid(payload?.postId)) {
    throw createHttpError("postId is required.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(`Invalid ${label}.`, HTTP_STATUS.BAD_REQUEST);
  }
}
