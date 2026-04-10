import {
  addMatchEventController,
  createMatchController,
  getMatchByIdController,
  listMatchesController,
  updateMatchFixtureController,
  updateMatchScoreController,
  updateMatchStatusController,
} from "@/modules/matches/controller";

export async function postMatchRoute(request) {
  return createMatchController(request);
}

export async function getMatchesRoute(request) {
  return listMatchesController(request);
}

export async function getMatchByIdRoute(request, context) {
  return getMatchByIdController(request, context);
}

export async function patchMatchByIdRoute(request, context) {
  return updateMatchFixtureController(request, context);
}

export async function postMatchEventRoute(request) {
  return addMatchEventController(request);
}

export async function postMatchStatusRoute(request, context) {
  return updateMatchStatusController(request, context);
}

export async function postMatchScoreRoute(request, context) {
  return updateMatchScoreController(request, context);
}
