import {
  createPlayerController,
  getPlayerByIdController,
  listPlayersController,
} from "@/modules/players/controller";

export async function postPlayerRoute(request) {
  return createPlayerController(request);
}

export async function getPlayersRoute() {
  return listPlayersController();
}

export async function getPlayerByIdRoute(request, context) {
  return getPlayerByIdController(request, context);
}
