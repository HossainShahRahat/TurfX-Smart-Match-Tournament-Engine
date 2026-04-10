import { HTTP_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export function assertDashboardApiResponse(response, fallbackMessage) {
  if (!response.ok) {
    throw createHttpError(
      fallbackMessage,
      response.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
