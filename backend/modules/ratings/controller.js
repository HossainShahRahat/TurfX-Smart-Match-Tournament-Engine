import { HTTP_STATUS, USER_ROLES } from "@/config/constants";
import { authorizeRoles } from "@/middleware/auth";
import { findPlayerByUserId } from "@/repositories/player.repository";
import { submitMatchRatings } from "@/services/rating.service";
import { errorResponse, successResponse } from "@/utils/api-response";
import { createHttpError } from "@/utils/http-error";

import { parseRatingsBody, validateRatingsSubmissionPayload } from "./validator";

export async function submitMatchRatingsController(request, context) {
  try {
    const user = authorizeRoles(request, [USER_ROLES.PLAYER]);
    const player = await findPlayerByUserId(user.id);

    if (!player) {
      throw createHttpError("Player profile not found for this account.", HTTP_STATUS.NOT_FOUND);
    }

    const { id } = await context.params;
    const body = await parseRatingsBody(request);
    validateRatingsSubmissionPayload(body);

    const ratings = await submitMatchRatings(id, player._id.toString(), body.ratings);
    return successResponse(ratings, "Ratings submitted successfully.", HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error, "Failed to submit ratings.");
  }
}
