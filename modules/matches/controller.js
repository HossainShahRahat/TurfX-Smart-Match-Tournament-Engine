import {
  HTTP_STATUS,
  MATCH_STATUS,
  USER_ROLES,
} from "@/config/constants";
import { authenticateRequest, authorizeRoles } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  addEventToMatch,
  createMatchRecord,
  getAllMatches,
  getMatchDetails,
  updateMatchStatus,
} from "./service";
import {
  parseMatchRequestBody,
  validateAddEventPayload,
  validateCreateMatchPayload,
  validateMatchId,
  validateMatchStatusPayload,
} from "./validator";

export async function createMatchController(request) {
  try {
    const currentUser = authorizeRoles(request, [
      USER_ROLES.ADMIN,
      USER_ROLES.TURF_OWNER,
    ]);
    const body = await parseMatchRequestBody(request);

    validateCreateMatchPayload(body);

    const match = await createMatchRecord(body, currentUser);

    return successResponse(
      match,
      "Match created successfully.",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error, "Failed to create match.");
  }
}

export async function listMatchesController(request) {
  try {
    authenticateRequest(request);
    const matches = await getAllMatches();
    return successResponse(matches, "Matches fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch matches.");
  }
}

export async function getMatchByIdController(request, context) {
  try {
    authenticateRequest(request);
    const { id } = await context.params;
    validateMatchId(id);

    const match = await getMatchDetails(id);
    return successResponse(match, "Match fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch match.");
  }
}

export async function addMatchEventController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN, USER_ROLES.TURF_OWNER]);
    const body = await parseMatchRequestBody(request);

    validateAddEventPayload(body);

    const result = await addEventToMatch(body);

    return successResponse(
      result,
      "Match event added successfully.",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error, "Failed to add match event.");
  }
}

export async function updateMatchStatusController(request, context) {
  try {
    const currentUser = authorizeRoles(request, [
      USER_ROLES.ADMIN,
      USER_ROLES.TURF_OWNER,
    ]);
    const { id } = await context.params;
    validateMatchId(id);

    const body = await parseMatchRequestBody(request);
    validateMatchStatusPayload(body);

    const match = await updateMatchStatus(id, body.status, currentUser);

    return successResponse(match, "Match status updated successfully.", HTTP_STATUS.OK);
  } catch (error) {
    return errorResponse(error, "Failed to update match status.");
  }
}
