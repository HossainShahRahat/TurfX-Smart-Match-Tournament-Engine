import {
  activateUserController,
  closeTournamentController,
  createAdminPlayerController,
  deleteCommentController,
  deleteMatchController,
  deletePostController,
  forceMatchStatusController,
  forceTournamentUpdateController,
  getAdminMatchesController,
  getAdminPlayersController,
  getAdminPostsController,
  getAdminTournamentsController,
  getAdminUsersController,
  getMatchEventsController,
  getSuperOverviewController,
  listSettingsController,
  notifyGlobalController,
  notifyRoleBasedController,
  pinPostController,
  resetMatchController,
  resetTournamentController,
  suspendUserController,
  upsertSettingController,
} from "./controller";

export async function getAdminSuperOverviewRoute(request) {
  return getSuperOverviewController(request);
}

export async function getAdminSuperUsersRoute(request) {
  return getAdminUsersController(request);
}

export async function postAdminSuspendUserRoute(request) {
  return suspendUserController(request);
}

export async function postAdminActivateUserRoute(request) {
  return activateUserController(request);
}

export async function getAdminMatchesRoute(request) {
  return getAdminMatchesController(request);
}

export async function postAdminMatchForceStatusRoute(request) {
  return forceMatchStatusController(request);
}

export async function postAdminMatchResetRoute(request) {
  return resetMatchController(request);
}

export async function deleteAdminMatchRoute(request) {
  return deleteMatchController(request);
}

export async function getAdminMatchEventsRoute(request) {
  return getMatchEventsController(request);
}

export async function getAdminTournamentsRoute(request) {
  return getAdminTournamentsController(request);
}

export async function postAdminTournamentResetRoute(request) {
  return resetTournamentController(request);
}

export async function postAdminTournamentForceUpdateRoute(request) {
  return forceTournamentUpdateController(request);
}

export async function postAdminTournamentForceCloseRoute(request) {
  return closeTournamentController(request);
}

export async function getAdminPostsRoute(request) {
  return getAdminPostsController(request);
}

export async function postAdminPostPinRoute(request) {
  return pinPostController(request);
}

export async function deleteAdminPostRoute(request) {
  return deletePostController(request);
}

export async function deleteAdminCommentRoute(request) {
  return deleteCommentController(request);
}

export async function getAdminPlayersRoute(request) {
  return getAdminPlayersController(request);
}

export async function postAdminPlayersRoute(request) {
  return createAdminPlayerController(request);
}

export async function getAdminSettingsRoute(request) {
  return listSettingsController(request);
}

export async function postAdminSettingsRoute(request) {
  return upsertSettingController(request);
}

export async function postAdminNotifyGlobalRoute(request) {
  return notifyGlobalController(request);
}

export async function postAdminNotifyRoleBasedRoute(request) {
  return notifyRoleBasedController(request);
}
