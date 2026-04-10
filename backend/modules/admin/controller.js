import { HTTP_STATUS, USER_ROLES } from "@/config/constants";
import { authorizeRoles } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  createHostedMatch,
  createHostedTournament,
  getAdminStats,
  getAdminUsers,
  getPlayerDashboard,
  getTurfStats,
} from "./service";
import {
  validateCreateHostedMatchPayload,
  validateCreateHostedTournamentPayload,
} from "./validator";

export async function getAdminStatsController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const stats = await getAdminStats();
    return successResponse(stats, "Admin statistics fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Unable to fetch admin statistics.");
  }
}

export async function getAdminUsersController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const users = await getAdminUsers();
    return successResponse(users, "Admin users fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Unable to fetch users.");
  }
}

export async function getTurfStatsController(request) {
  try {
    const user = authorizeRoles(request, [USER_ROLES.TURF_OWNER]);
    const stats = await getTurfStats(user);
    return successResponse(stats, "Turf statistics fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Unable to fetch turf statistics.");
  }
}

export async function createHostedMatchController(request) {
  try {
    const user = authorizeRoles(request, [USER_ROLES.TURF_OWNER]);
    const body = await request.json();

    validateCreateHostedMatchPayload(body);

    const result = await createHostedMatch(user, {
      title: String(body.title).trim(),
      scheduledAt: body.scheduledAt,
      playerIds: Array.isArray(body.playerIds) ? body.playerIds : [],
    });

    return successResponse(result, "Hosted match draft created.", HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error, "Unable to create turf match.");
  }
}

export async function createHostedTournamentController(request) {
  try {
    const user = authorizeRoles(request, [USER_ROLES.TURF_OWNER]);
    const body = await request.json();

    validateCreateHostedTournamentPayload(body);

    const result = await createHostedTournament(user, {
      name: String(body.name).trim(),
      startDate: body.startDate,
      format: body.format || "league",
    });

    return successResponse(result, "Hosted tournament draft created.", HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error, "Unable to create tournament.");
  }
}

export async function getPlayerDashboardController(request) {
  try {
    const user = authorizeRoles(request, [USER_ROLES.PLAYER]);
    const result = await getPlayerDashboard(user);
    return successResponse(result, "Player dashboard fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Unable to fetch player dashboard.");
  }
}
