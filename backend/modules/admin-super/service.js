import { HTTP_STATUS, MATCH_STATUS, TOURNAMENT_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";
import { countUsers, listUsers, updateUserById, findUserById } from "@/repositories/user.repository";
import { listMatches, findMatchById, updateMatch, deleteMatchById } from "@/repositories/match.repository";
import { listTournaments, findTournamentById, updateTournament } from "@/repositories/tournament.repository";
import { listEvents, deleteEvents } from "@/repositories/event.repository";
import {
  countComments,
  deleteCommentById,
  deleteComments,
  deletePostById,
  deletePostLikes,
  findPostById,
  listComments,
  listPosts,
  updatePost,
} from "@/repositories/feed.repository";
import { createAuditLog } from "@/repositories/audit-log.repository";
import { listPlayers } from "@/repositories/player.repository";
import { upsertSetting, listSettings } from "@/repositories/system-settings.repository";
import { getAdminSuperOverview } from "@/services/adminAnalytics.service";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function pickRequestMetadata(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip");
  return {
    ip: ip || null,
    userAgent: request.headers.get("user-agent") || null,
  };
}

export async function logAdminAction(request, admin, payload) {
  const { ip, userAgent } = pickRequestMetadata(request);
  await createAuditLog({
    adminId: admin.id,
    action: payload.action,
    targetEntity: payload.targetEntity,
    targetId: payload.targetId || null,
    metadata: payload.metadata || {},
    ip,
    userAgent,
  });
}

export async function getSuperOverview() {
  return getAdminSuperOverview({ days: 14 });
}

export async function getAdminUsers(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (options.role) {
    filter.role = options.role;
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.q) {
    const term = String(options.q).trim();
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }
  }

  const [total, users] = await Promise.all([
    countUsers(filter),
    listUsers(filter, {
      sort: { createdAt: -1 },
      skip,
      limit,
      select: "name email role turfId status suspendedAt suspensionReason createdAt updatedAt",
    }),
  ]);

  return {
    page,
    limit,
    total,
    rows: users.map((user) => ({
      id: normalizeId(user),
      name: user.name,
      email: user.email,
      role: user.role,
      turfId: user.turfId || null,
      status: user.status || "active",
      suspendedAt: user.suspendedAt || null,
      suspensionReason: user.suspensionReason || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
  };
}

export async function suspendUser(request, admin, userId, reason = null) {
  const user = await findUserById(userId);
  if (!user) throw createHttpError("User not found.", HTTP_STATUS.NOT_FOUND);

  const updated = await updateUserById(userId, {
    status: "suspended",
    suspendedAt: new Date(),
    suspensionReason: reason ? String(reason).trim() : null,
  });

  await logAdminAction(request, admin, {
    action: "user.suspend",
    targetEntity: "User",
    targetId: userId,
    metadata: { reason: reason || null },
  });

  return {
    id: normalizeId(updated),
    status: updated.status,
    suspendedAt: updated.suspendedAt,
    suspensionReason: updated.suspensionReason || null,
  };
}

export async function activateUser(request, admin, userId) {
  const user = await findUserById(userId);
  if (!user) throw createHttpError("User not found.", HTTP_STATUS.NOT_FOUND);

  const updated = await updateUserById(userId, {
    status: "active",
    suspendedAt: null,
    suspensionReason: null,
  });

  await logAdminAction(request, admin, {
    action: "user.activate",
    targetEntity: "User",
    targetId: userId,
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function getAdminMatches(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const matches = await listMatches(
    {},
    {
      sort: { createdAt: -1 },
      populatePlayers: true,
      populateCreator: true,
      skip,
      limit,
      lean: true,
    }
  );

  return {
    page,
    limit,
    rows: matches.map((m) => ({
      id: normalizeId(m),
      status: m.status,
      tournamentId: normalizeId(m.tournamentId),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      createdBy: m.createdBy
        ? {
            id: normalizeId(m.createdBy),
            name: m.createdBy.name,
            email: m.createdBy.email,
            role: m.createdBy.role,
          }
        : null,
    })),
  };
}

export async function forceMatchStatus(request, admin, matchId, status) {
  const match = await findMatchById(matchId);
  if (!match) throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);

  const updated = await updateMatch(matchId, { status });

  await logAdminAction(request, admin, {
    action: "match.force_status",
    targetEntity: "Match",
    targetId: matchId,
    metadata: { from: match.status, to: status },
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function resetMatch(request, admin, matchId) {
  const match = await findMatchById(matchId);
  if (!match) throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);

  await deleteEvents({ matchId });
  const updated = await updateMatch(matchId, { status: MATCH_STATUS.PENDING });

  await logAdminAction(request, admin, {
    action: "match.reset",
    targetEntity: "Match",
    targetId: matchId,
    metadata: { previousStatus: match.status },
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function deleteMatch(request, admin, matchId) {
  const match = await findMatchById(matchId);
  if (!match) throw createHttpError("Match not found.", HTTP_STATUS.NOT_FOUND);

  await deleteEvents({ matchId });
  await deleteMatchById(matchId);

  await logAdminAction(request, admin, {
    action: "match.delete",
    targetEntity: "Match",
    targetId: matchId,
    metadata: { status: match.status, tournamentId: normalizeId(match.tournamentId) },
  });

  return { deleted: true };
}

export async function getMatchEvents(matchId) {
  const events = await listEvents(
    { matchId },
    { sort: { minute: 1, createdAt: 1 }, populatePlayer: true, lean: true }
  );

  return events.map((e) => ({
    id: normalizeId(e),
    matchId: normalizeId(e.matchId),
    playerId: normalizeId(e.playerId),
    playerName: e.playerId?.name || null,
    type: e.type,
    minute: e.minute,
    createdAt: e.createdAt,
  }));
}

export async function getAdminTournaments(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const tournaments = await listTournaments(
    {},
    { sort: { createdAt: -1 }, populateCreator: true, skip, limit, lean: true }
  );

  return {
    page,
    limit,
    rows: tournaments.map((t) => ({
      id: normalizeId(t),
      name: t.name,
      type: t.type,
      status: t.status,
      matchesCount: Array.isArray(t.matches) ? t.matches.length : 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      createdBy: t.createdBy
        ? {
            id: normalizeId(t.createdBy),
            name: t.createdBy.name,
            email: t.createdBy.email,
            role: t.createdBy.role,
          }
        : null,
    })),
  };
}

export async function closeTournament(request, admin, tournamentId) {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);

  const updated = await updateTournament(tournamentId, { status: TOURNAMENT_STATUS.COMPLETED });

  await logAdminAction(request, admin, {
    action: "tournament.force_close",
    targetEntity: "Tournament",
    targetId: tournamentId,
    metadata: { from: tournament.status, to: TOURNAMENT_STATUS.COMPLETED },
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function resetTournament(request, admin, tournamentId) {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);

  const updated = await updateTournament(tournamentId, {
    status: TOURNAMENT_STATUS.UPCOMING,
    stages: {
      leagueGenerated: false,
      knockoutGenerated: false,
      rounds: [],
    },
  });

  await logAdminAction(request, admin, {
    action: "tournament.reset",
    targetEntity: "Tournament",
    targetId: tournamentId,
    metadata: { previousStatus: tournament.status },
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function forceTournamentUpdate(request, admin, tournamentId, payload) {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw createHttpError("Tournament not found.", HTTP_STATUS.NOT_FOUND);

  const patch = {};
  if (payload.status) patch.status = payload.status;
  if (payload.rules) patch.rules = payload.rules;

  const updated = await updateTournament(tournamentId, patch);

  await logAdminAction(request, admin, {
    action: "tournament.force_update",
    targetEntity: "Tournament",
    targetId: tournamentId,
    metadata: { patch },
  });

  return { id: normalizeId(updated), status: updated.status };
}

export async function listAdminPosts(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (options.type) {
    filter.type = options.type;
  }
  if (options.q) {
    const term = String(options.q).trim();
    if (term) {
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { content: { $regex: term, $options: "i" } },
      ];
    }
  }

  const posts = await listPosts(filter, {
    sort: { createdAt: -1 },
    skip,
    limit,
    lean: true,
  });

  return {
    page,
    limit,
    rows: posts.map((p) => ({
      id: normalizeId(p),
      type: p.type,
      title: p.title,
      content: p.content,
      likesCount: p.likesCount || 0,
      commentsCount: p.commentsCount || 0,
      systemGenerated: p.systemGenerated || false,
      pinned: Boolean(p.metadata?.pinned),
      createdAt: p.createdAt,
    })),
  };
}

export async function pinPost(request, admin, postId, pinned) {
  const post = await findPostById(postId);
  if (!post) throw createHttpError("Post not found.", HTTP_STATUS.NOT_FOUND);

  const metadata = { ...(post.metadata || {}), pinned: Boolean(pinned), pinnedAt: pinned ? new Date() : null };
  const updated = await updatePost(postId, { metadata });

  await logAdminAction(request, admin, {
    action: pinned ? "post.pin" : "post.unpin",
    targetEntity: "Post",
    targetId: postId,
  });

  return { id: normalizeId(updated), pinned: Boolean(updated.metadata?.pinned) };
}

export async function deletePost(request, admin, postId) {
  const post = await findPostById(postId, { lean: true });
  if (!post) throw createHttpError("Post not found.", HTTP_STATUS.NOT_FOUND);

  await deleteComments({ postId });
  await deletePostLikes({ postId });
  await deletePostById(postId);

  await logAdminAction(request, admin, {
    action: "post.delete",
    targetEntity: "Post",
    targetId: postId,
    metadata: { type: post.type, systemGenerated: post.systemGenerated || false },
  });

  return { deleted: true };
}

export async function deleteComment(request, admin, commentId) {
  const deleted = await deleteCommentById(commentId);
  if (!deleted) throw createHttpError("Comment not found.", HTTP_STATUS.NOT_FOUND);

  const postId = normalizeId(deleted.postId);
  if (postId) {
    const commentsCount = await countComments({ postId });
    await updatePost(postId, { commentsCount });
  }

  await logAdminAction(request, admin, {
    action: "comment.delete",
    targetEntity: "Comment",
    targetId: commentId,
    metadata: { postId },
  });

  return { deleted: true };
}

export async function getAdminPlayers(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (options.q) {
    const term = String(options.q).trim();
    if (term) {
      filter.name = { $regex: term, $options: "i" };
    }
  }

  const players = await listPlayers(filter, {
    sort: { updatedAt: -1 },
    skip,
    limit,
    lean: true,
  });

  return {
    page,
    limit,
    rows: players.map((p) => ({
      id: normalizeId(p),
      name: p.name,
      skillRating: p.skillRating || 0,
      totalGoals: p.totalGoals || 0,
      totalMatches: p.totalMatches || 0,
      userId: normalizeId(p.userId),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };
}

export async function upsertSystemSetting(request, admin, payload) {
  const updated = await upsertSetting(payload.key.trim(), {
    key: payload.key.trim(),
    value: payload.value,
    updatedBy: admin.id,
  });

  await logAdminAction(request, admin, {
    action: "settings.upsert",
    targetEntity: "SystemSettings",
    targetId: payload.key.trim(),
  });

  return {
    key: updated.key,
    value: updated.value,
    updatedBy: normalizeId(updated.updatedBy),
    updatedAt: updated.updatedAt,
  };
}

export async function listSystemSettings(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (options.q) {
    const term = String(options.q).trim();
    if (term) {
      filter.key = { $regex: term, $options: "i" };
    }
  }

  const settings = await listSettings(filter, { sort: { updatedAt: -1 }, skip, limit });
  return {
    page,
    limit,
    rows: settings.map((s) => ({
      key: s.key,
      value: s.value,
      updatedBy: normalizeId(s.updatedBy),
      updatedAt: s.updatedAt,
    })),
  };
}

export async function notifyGlobal(request, admin, payload) {
  await logAdminAction(request, admin, {
    action: "notify.global",
    targetEntity: "Notification",
    targetId: null,
    metadata: { note: "Notification subsystem not wired in this repo.", payload },
  });

  return {
    queued: false,
    message:
      "Notification subsystem is not wired in this codebase. Endpoint logs the intent for audit purposes.",
  };
}

export async function notifyRoleBased(request, admin, payload) {
  await logAdminAction(request, admin, {
    action: "notify.role_based",
    targetEntity: "Notification",
    targetId: null,
    metadata: { note: "Notification subsystem not wired in this repo.", payload },
  });

  return {
    queued: false,
    message:
      "Notification subsystem is not wired in this codebase. Endpoint logs the intent for audit purposes.",
  };
}

