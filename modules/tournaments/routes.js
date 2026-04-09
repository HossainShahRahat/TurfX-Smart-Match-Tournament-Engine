import {
  createTournamentController,
  generateTournamentController,
  getTournamentByIdController,
  listTournamentsController,
} from "@/modules/tournaments/controller";

export async function postTournamentRoute(request) {
  return createTournamentController(request);
}

export async function getTournamentsRoute(request) {
  return listTournamentsController(request);
}

export async function getTournamentByIdRoute(request, context) {
  return getTournamentByIdController(request, context);
}

export async function postTournamentGenerateRoute(request) {
  return generateTournamentController(request);
}
