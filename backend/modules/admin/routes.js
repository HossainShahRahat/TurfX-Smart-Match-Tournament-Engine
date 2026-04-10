import {
  createHostedMatchController,
  createHostedTournamentController,
  getAdminStatsController,
  getAdminUsersController,
  getPlayerDashboardController,
  getTurfStatsController,
} from "@/modules/admin/controller";

export async function getAdminStatsRoute(request) {
  return getAdminStatsController(request);
}

export async function getAdminUsersRoute(request) {
  return getAdminUsersController(request);
}

export async function getTurfStatsRoute(request) {
  return getTurfStatsController(request);
}

export async function postTurfMatchRoute(request) {
  return createHostedMatchController(request);
}

export async function postTurfTournamentRoute(request) {
  return createHostedTournamentController(request);
}

export async function getPlayerDashboardRoute(request) {
  return getPlayerDashboardController(request);
}
