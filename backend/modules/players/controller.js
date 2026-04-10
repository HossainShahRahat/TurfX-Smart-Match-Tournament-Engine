import { HTTP_STATUS } from "@/config/constants";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  createPlayerProfile,
  getAllPlayers,
  getPlayerById,
} from "./service";
import {
  parsePlayerRequestBody,
  validateCreatePlayerPayload,
  validatePlayerId,
} from "./validator";

export async function createPlayerController(request) {
  try {
    const body = await parsePlayerRequestBody(request);
    validateCreatePlayerPayload(body);

    const player = await createPlayerProfile(body);

    return successResponse(
      player,
      "Player created successfully.",
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error, "Failed to create player.");
  }
}

export async function listPlayersController() {
  try {
    const players = await getAllPlayers();
    return successResponse(players, "Players fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch players.");
  }
}

export async function getPlayerByIdController(_request, context) {
  try {
    const { id } = await context.params;
    validatePlayerId(id);

    const player = await getPlayerById(id);
    return successResponse(player, "Player fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch player.");
  }
}
