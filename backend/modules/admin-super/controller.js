import { USER_ROLES } from "@/config/constants";
import { authorizeRoles } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  activateUser,
  closeTournament,
  createAdminPlayer,
  deleteComment,
  deleteMatch,
  deletePost,
  forceMatchStatus,
  forceTournamentUpdate,
  getAdminMatches,
  getAdminPlayers,
  getAdminTournaments,
  getAdminUsers,
  getMatchEvents,
  getSuperOverview,
  listAdminPosts,
  listSystemSettings,
  notifyGlobal,
  notifyRoleBased,
  pinPost,
  resetMatch,
  resetTournament,
  suspendUser,
  upsertSystemSetting,
} from "./service";

import {
  parseJsonBody,
  validateAdminCreatePlayerPayload,
  validateDeleteCommentPayload,
  validateDeletePostPayload,
  validateMatchForceStatusPayload,
  validateObjectId,
  validateSuspendPayload,
  validateTournamentForceUpdatePayload,
  validateUpsertSettingPayload,
  validateUserRoleFilter,
} from "./validator";

export async function getSuperOverviewController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const data = await getSuperOverview();
    return successResponse(data, "Super overview fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch super overview.");
  }
}

export async function getAdminUsersController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    validateUserRoleFilter(role);

    const data = await getAdminUsers({ role, status, q, page, limit });
    return successResponse(data, "Users fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch users.");
  }
}

export async function suspendUserController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateSuspendPayload(body);
    const data = await suspendUser(request, admin, body.userId, body.reason || null);
    return successResponse(data, "User suspended successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to suspend user.");
  }
}

export async function activateUserController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateObjectId(body?.userId, "userId");
    const data = await activateUser(request, admin, body.userId);
    return successResponse(data, "User activated successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to activate user.");
  }
}

export async function getAdminMatchesController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const data = await getAdminMatches({ page, limit });
    return successResponse(data, "Matches fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch matches.");
  }
}

export async function forceMatchStatusController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateMatchForceStatusPayload(body);
    const data = await forceMatchStatus(request, admin, body.matchId, body.status);
    return successResponse(data, "Match status updated successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to force match status.");
  }
}

export async function resetMatchController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateObjectId(body?.matchId, "matchId");
    const data = await resetMatch(request, admin, body.matchId);
    return successResponse(data, "Match reset successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to reset match.");
  }
}

export async function deleteMatchController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");
    validateObjectId(matchId, "matchId");
    const data = await deleteMatch(request, admin, matchId);
    return successResponse(data, "Match deleted successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to delete match.");
  }
}

export async function getMatchEventsController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");
    validateObjectId(matchId, "matchId");
    const data = await getMatchEvents(matchId);
    return successResponse(data, "Match events fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch match events.");
  }
}

export async function getAdminTournamentsController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const data = await getAdminTournaments({ page, limit });
    return successResponse(data, "Tournaments fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch tournaments.");
  }
}

export async function resetTournamentController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateObjectId(body?.tournamentId, "tournamentId");
    const data = await resetTournament(request, admin, body.tournamentId);
    return successResponse(data, "Tournament reset successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to reset tournament.");
  }
}

export async function forceTournamentUpdateController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateTournamentForceUpdatePayload(body);
    const data = await forceTournamentUpdate(request, admin, body.tournamentId, body);
    return successResponse(data, "Tournament updated successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to update tournament.");
  }
}

export async function closeTournamentController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateObjectId(body?.tournamentId, "tournamentId");
    const data = await closeTournament(request, admin, body.tournamentId);
    return successResponse(data, "Tournament closed successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to close tournament.");
  }
}

export async function getAdminPostsController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const data = await listAdminPosts({ q, type, page, limit });
    return successResponse(data, "Posts fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch posts.");
  }
}

export async function pinPostController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateObjectId(body?.postId, "postId");
    const data = await pinPost(request, admin, body.postId, Boolean(body.pinned));
    return successResponse(data, "Post pin updated successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to pin post.");
  }
}

export async function deletePostController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    validateDeletePostPayload({ postId });
    const data = await deletePost(request, admin, postId);
    return successResponse(data, "Post deleted successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to delete post.");
  }
}

export async function deleteCommentController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    validateDeleteCommentPayload({ commentId });
    const data = await deleteComment(request, admin, commentId);
    return successResponse(data, "Comment deleted successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to delete comment.");
  }
}

export async function getAdminPlayersController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const data = await getAdminPlayers({ q, page, limit });
    return successResponse(data, "Players fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch players.");
  }
}

export async function createAdminPlayerController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateAdminCreatePlayerPayload(body);
    const data = await createAdminPlayer(request, admin, body);
    return successResponse(data, "Player account created successfully.", 201);
  } catch (error) {
    return errorResponse(error, "Failed to create player account.");
  }
}

export async function listSettingsController(request) {
  try {
    authorizeRoles(request, [USER_ROLES.ADMIN]);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const data = await listSystemSettings({ q, page, limit });
    return successResponse(data, "Settings fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch settings.");
  }
}

export async function upsertSettingController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    validateUpsertSettingPayload(body);
    const data = await upsertSystemSetting(request, admin, body);
    return successResponse(data, "Setting updated successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to update setting.");
  }
}

export async function notifyGlobalController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    const data = await notifyGlobal(request, admin, body);
    return successResponse(data, "Global notification request recorded.");
  } catch (error) {
    return errorResponse(error, "Failed to send global notification.");
  }
}

export async function notifyRoleBasedController(request) {
  try {
    const admin = authorizeRoles(request, [USER_ROLES.ADMIN]);
    const body = await parseJsonBody(request);
    const data = await notifyRoleBased(request, admin, body);
    return successResponse(data, "Role-based notification request recorded.");
  } catch (error) {
    return errorResponse(error, "Failed to send role-based notification.");
  }
}
