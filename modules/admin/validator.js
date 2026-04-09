import { HTTP_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export function validateCreateHostedMatchPayload(body) {
  if (!body?.title || !body?.scheduledAt) {
    throw createHttpError(
      "title and scheduledAt are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateCreateHostedTournamentPayload(body) {
  if (!body?.name || !body?.startDate) {
    throw createHttpError(
      "name and startDate are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}
