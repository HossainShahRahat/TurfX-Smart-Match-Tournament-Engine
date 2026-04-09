import { HTTP_STATUS, USER_ROLES } from "@/config/constants";
import { authenticateRequest, authorizeRoles } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  createTournament,
  createTournamentFixtures,
  getTournamentDetails,
  listAllTournaments,
} from "./service";
import {
  parseTournamentRequestBody,
  validateCreateTournamentPayload,
  validateGenerateTournamentPayload,
  validateTournamentId,
} from "./validator";

export async function createTournamentController(request) {
  try {
    const currentUser = authorizeRoles(request, [
      USER_ROLES.ADMIN,
      USER_ROLES.TURF_OWNER,
    ]);
    const body = await parseTournamentRequestBody(request);

    validateCreateTournamentPayload(body);

    const tournament = await createTournament(body, currentUser);

    return successResponse(
      tournament,
      "Tournament created successfully.",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error, "Failed to create tournament.");
  }
}

export async function listTournamentsController(request) {
  try {
    authenticateRequest(request);
    const tournaments = await listAllTournaments();
    return successResponse(tournaments, "Tournaments fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch tournaments.");
  }
}

export async function getTournamentByIdController(request, context) {
  try {
    authenticateRequest(request);
    const { id } = await context.params;
    validateTournamentId(id);

    const tournament = await getTournamentDetails(id);
    return successResponse(tournament, "Tournament fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch tournament.");
  }
}

export async function generateTournamentController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN, USER_ROLES.TURF_OWNER]);
    const body = await parseTournamentRequestBody(request);

    validateGenerateTournamentPayload(body);

    const tournament = await createTournamentFixtures(body.tournamentId);

    return successResponse(
      tournament,
      "Tournament fixtures generated successfully.",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error, "Failed to generate tournament fixtures.");
  }
}
