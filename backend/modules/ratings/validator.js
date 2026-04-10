import mongoose from "mongoose";

import { HTTP_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parseRatingsBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateRatingsSubmissionPayload(payload) {
  if (!Array.isArray(payload?.ratings) || !payload.ratings.length) {
    throw createHttpError("ratings must be a non-empty array.", HTTP_STATUS.BAD_REQUEST);
  }

  for (const rating of payload.ratings) {
    if (!mongoose.Types.ObjectId.isValid(rating?.ratedPlayerId)) {
      throw createHttpError("Each rating must include a valid ratedPlayerId.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!Number.isInteger(rating?.score) || rating.score < 1 || rating.score > 10) {
      throw createHttpError("Each rating score must be an integer from 1 to 10.", HTTP_STATUS.BAD_REQUEST);
    }

    if (rating?.note && String(rating.note).length > 240) {
      throw createHttpError("Rating notes must be 240 characters or less.", HTTP_STATUS.BAD_REQUEST);
    }
  }
}
