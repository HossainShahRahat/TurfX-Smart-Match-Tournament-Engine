import { HTTP_STATUS, MATCH_EVENT_TYPES, MATCH_STATUS, POST_TYPES } from "@/config/constants";
import { listEvents } from "@/repositories/event.repository";
import {
  countComments,
  createComment,
  createPost,
  createPostLike,
  countPostLikes,
  findPost,
  findPostById,
  listComments,
  listPosts,
  updatePost,
} from "@/repositories/feed.repository";
import { listMatches } from "@/repositories/match.repository";
import { listPlayers, findPlayerById } from "@/repositories/player.repository";
import { listTournaments } from "@/repositories/tournament.repository";
import { createHttpError } from "@/utils/http-error";

function normalizeId(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

function sanitizeComment(comment) {
  return {
    id: normalizeId(comment),
    postId: normalizeId(comment.postId),
    userId: normalizeId(comment.userId),
    authorName: comment.userId?.name || null,
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

function sanitizePost(post, extra = {}) {
  return {
    id: normalizeId(post),
    authorId: normalizeId(post.authorId) || post.authorId,
    type: post.type,
    title: post.title,
    content: post.content,
    media: post.media || [],
    matchId: normalizeId(post.matchId),
    tournamentId: normalizeId(post.tournamentId),
    playerId: normalizeId(post.playerId),
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    systemGenerated: post.systemGenerated || false,
    metadata: post.metadata || {},
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    ...extra,
  };
}

function truncateTimeline(timeline = [], limit = 3) {
  return timeline
    .filter((event) => event.type === MATCH_EVENT_TYPES.GOAL)
    .slice(0, limit)
    .map((event) => `${event.playerName || "Player"} ${event.minute}'`);
}

function getTopScorerFromTimeline(timeline = []) {
  const scorerMap = new Map();

  for (const event of timeline) {
    if (event.type !== MATCH_EVENT_TYPES.GOAL) {
      continue;
    }

    const key = event.playerId;
    const current = scorerMap.get(key) || {
      playerId: event.playerId,
      playerName: event.playerName || "Player",
      goals: 0,
    };

    current.goals += 1;
    scorerMap.set(key, current);
  }

  return [...scorerMap.values()].sort((left, right) => right.goals - left.goals)[0] || null;
}

async function getFinishedMatchesWithoutHighlights() {
  const finishedMatches = await listMatches(
    {
      status: MATCH_STATUS.FINISHED,
    },
    {
      sort: { updatedAt: -1 },
      populatePlayers: true,
      lean: true,
    }
  );

  const posts = await listPosts(
    {
      type: POST_TYPES.MATCH_HIGHLIGHT,
    },
    { lean: true }
  );

  const highlightedMatchIds = new Set(posts.map((post) => normalizeId(post.matchId)));

  return finishedMatches.filter(
    (match) => !highlightedMatchIds.has(normalizeId(match._id))
  );
}

async function buildMatchSummary(match) {
  const events = await listEvents(
    { matchId: match._id },
    {
      sort: { minute: 1, createdAt: 1 },
      populatePlayer: true,
      lean: true,
    }
  );

  const goalEvents = events.filter((event) => event.type === MATCH_EVENT_TYPES.GOAL);
  const teamAIds = new Set((match.teamA || []).map((player) => normalizeId(player)));
  const teamBIds = new Set((match.teamB || []).map((player) => normalizeId(player)));
  const score = { teamA: 0, teamB: 0 };

  for (const event of goalEvents) {
    const playerId = normalizeId(event.playerId);

    if (teamAIds.has(playerId)) {
      score.teamA += 1;
    }

    if (teamBIds.has(playerId)) {
      score.teamB += 1;
    }
  }

  return {
    score,
    timeline: events.map((event) => ({
      playerId: normalizeId(event.playerId),
      playerName: event.playerId?.name || null,
      type: event.type,
      minute: event.minute,
    })),
  };
}

export async function createPostEntry(payload) {
  const post = await createPost({
    authorId: payload.authorId,
    type: payload.type,
    title: payload.title.trim(),
    content: payload.content.trim(),
    media: payload.media || [],
    matchId: payload.matchId || null,
    tournamentId: payload.tournamentId || null,
    playerId: payload.playerId || null,
    likesCount: 0,
    commentsCount: 0,
    systemGenerated: payload.systemGenerated || false,
    metadata: payload.metadata || {},
  });

  return sanitizePost(post);
}

export async function generateMatchHighlight(match) {
  const existing = await findPost(
    {
      type: POST_TYPES.MATCH_HIGHLIGHT,
      matchId: match._id,
    },
    { lean: true }
  );

  if (existing) {
    return sanitizePost(existing);
  }

  const { score, timeline } = await buildMatchSummary(match);
  const topScorer = getTopScorerFromTimeline(timeline);
  const goalsSummary = truncateTimeline(timeline, 4);
  const title = `Match Highlight: ${score.teamA} - ${score.teamB}`;
  const content = [
    `Final score ended ${score.teamA}-${score.teamB}.`,
    topScorer
      ? `Top scorer: ${topScorer.playerName} (${topScorer.goals} goal${topScorer.goals > 1 ? "s" : ""}).`
      : "No goals were scored in this fixture.",
    goalsSummary.length ? `Key moments: ${goalsSummary.join(", ")}.` : "Key moments were defensive and tactical.",
  ].join(" ");

  return createPostEntry({
    authorId: "system",
    type: POST_TYPES.MATCH_HIGHLIGHT,
    title,
    content,
    matchId: normalizeId(match._id),
    tournamentId: normalizeId(match.tournamentId),
    systemGenerated: true,
    metadata: {
      score,
      topScorer,
      keyEvents: goalsSummary,
    },
  });
}

async function generatePlayerMilestonePosts() {
  const players = await listPlayers({}, { sort: { totalGoals: -1 }, lean: true });
  const milestones = [5, 10, 20, 50];

  for (const player of players) {
    for (const milestone of milestones) {
      if ((player.totalGoals || 0) < milestone) {
        continue;
      }

      const existing = await findPost(
        {
          type: POST_TYPES.PLAYER_UPDATE,
          playerId: player._id,
          "metadata.milestone": milestone,
        },
        { lean: true }
      );

      if (existing) {
        continue;
      }

      await createPostEntry({
        authorId: "system",
        type: POST_TYPES.PLAYER_UPDATE,
        title: `${player.name} reaches ${milestone} goals`,
        content: `${player.name} has now scored ${player.totalGoals} goals and carries a skill rating of ${player.skillRating || 0}.`,
        playerId: normalizeId(player._id),
        systemGenerated: true,
        metadata: {
          milestone,
          totalGoals: player.totalGoals,
          skillRating: player.skillRating,
        },
      });
    }
  }
}

async function generateTournamentUpdatePosts() {
  const tournaments = await listTournaments(
    { status: "completed" },
    { sort: { updatedAt: -1 }, lean: true }
  );

  for (const tournament of tournaments) {
    const existing = await findPost(
      {
        type: POST_TYPES.TOURNAMENT_UPDATE,
        tournamentId: tournament._id,
        "metadata.kind": "completed",
      },
      { lean: true }
    );

    if (existing) {
      continue;
    }

    await createPostEntry({
      authorId: "system",
      type: POST_TYPES.TOURNAMENT_UPDATE,
      title: `${tournament.name} has been completed`,
      content: `The ${tournament.type} tournament has wrapped up. Review the final bracket and standings for the full story.`,
      tournamentId: normalizeId(tournament._id),
      systemGenerated: true,
      metadata: {
        kind: "completed",
        status: tournament.status,
      },
    });
  }
}

async function generateSkillRankingChangePosts() {
  const topN = 10;
  const players = await listPlayers({}, { sort: { skillRating: -1, updatedAt: -1 }, lean: true });
  const leaderboard = players.slice(0, topN);

  for (let index = 0; index < leaderboard.length; index += 1) {
    const player = leaderboard[index];
    const rank = index + 1;

    const existing = await findPost(
      {
        type: POST_TYPES.PLAYER_UPDATE,
        playerId: player._id,
        "metadata.kind": "rank_top10",
      },
      { lean: true }
    );

    if (existing) {
      continue;
    }

    await createPostEntry({
      authorId: "system",
      type: POST_TYPES.PLAYER_UPDATE,
      title: `${player.name} enters the Top ${topN}`,
      content: `${player.name} is now ranked #${rank} on TurfX with a skill rating of ${player.skillRating || 0}.`,
      playerId: normalizeId(player._id),
      systemGenerated: true,
      metadata: {
        kind: "rank_top10",
        rank,
        skillRating: player.skillRating || 0,
      },
    });
  }
}

export async function syncAutoGeneratedContent() {
  const matches = await getFinishedMatchesWithoutHighlights();

  for (const match of matches) {
    await generateMatchHighlight(match);
  }

  await generatePlayerMilestonePosts();
  await generateSkillRankingChangePosts();
  await generateTournamentUpdatePosts();
}

export async function generateFeed(_userId, options = {}) {
  await syncAutoGeneratedContent();

  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 30);
  const skip = (page - 1) * limit;

  const posts = await listPosts(
    {},
    {
      sort: { createdAt: -1 },
      skip,
      limit,
      lean: true,
    }
  );

  return posts.map((post) => sanitizePost(post));
}

export async function likePost(postId, userId) {
  const post = await findPostById(postId);

  if (!post) {
    throw createHttpError("Post not found.", HTTP_STATUS.NOT_FOUND);
  }

  try {
    await createPostLike({
      postId,
      userId,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw createHttpError("You already liked this post.", HTTP_STATUS.CONFLICT);
    }

    throw error;
  }

  const likesCount = await countPostLikes({ postId });
  const updatedPost = await updatePost(postId, { likesCount });
  return sanitizePost(updatedPost);
}

export async function addCommentToPost(postId, userId, text) {
  const post = await findPostById(postId);

  if (!post) {
    throw createHttpError("Post not found.", HTTP_STATUS.NOT_FOUND);
  }

  const recentComments = await listComments(
    {
      userId,
      createdAt: {
        $gte: new Date(Date.now() - 5_000),
      },
    },
    { sort: { createdAt: -1 }, limit: 1, lean: true }
  );

  if (recentComments.length > 0) {
    throw createHttpError(
      "You're commenting too quickly. Please wait a moment and try again.",
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  const comment = await createComment({
    postId,
    userId,
    text: text.trim(),
  });

  const commentsCount = await countComments({ postId });
  await updatePost(postId, { commentsCount });

  const comments = await listComments(
    { postId },
    { sort: { createdAt: -1 }, limit: 20, lean: true }
  );

  return {
    comment: sanitizeComment(comment),
    comments: comments.map(sanitizeComment),
    commentsCount,
  };
}

export async function getPostDetails(postId) {
  await syncAutoGeneratedContent();

  const post = await findPostById(postId, { lean: true });

  if (!post) {
    throw createHttpError("Post not found.", HTTP_STATUS.NOT_FOUND);
  }

  const comments = await listComments(
    { postId },
    { sort: { createdAt: -1 }, limit: 30, lean: true }
  );

  return sanitizePost(post, {
    comments: comments.map(sanitizeComment),
  });
}

export async function getPlayerPublicProfile(playerId) {
  await syncAutoGeneratedContent();

  const player = await findPlayerById(playerId, { lean: true });

  if (!player) {
    throw createHttpError("Player not found.", HTTP_STATUS.NOT_FOUND);
  }

  const posts = await listPosts(
    {
      $or: [{ playerId }, { "metadata.topScorer.playerId": playerId }],
    },
    {
      sort: { createdAt: -1 },
      limit: 10,
      lean: true,
    }
  );

  const matches = await listMatches(
    {
      $or: [{ teamA: playerId }, { teamB: playerId }],
    },
    {
      sort: { createdAt: -1 },
      limit: 10,
      populatePlayers: true,
      lean: true,
    }
  );

  const cardEvents = await listEvents(
    {
      playerId,
      type: {
        $in: [MATCH_EVENT_TYPES.YELLOW_CARD, MATCH_EVENT_TYPES.RED_CARD],
      },
    },
    { lean: true }
  );

  const commentsReceived = await countComments({
    postId: {
      $in: posts.map((post) => post._id),
    },
  });

  return {
    id: normalizeId(player),
    name: player.name,
    skillRating: player.skillRating || 0,
    stats: {
      goals: player.totalGoals || 0,
      matches: player.totalMatches || 0,
      cards: cardEvents.length,
      yellowCards: cardEvents.filter((event) => event.type === MATCH_EVENT_TYPES.YELLOW_CARD).length,
      redCards: cardEvents.filter((event) => event.type === MATCH_EVENT_TYPES.RED_CARD).length,
    },
    matchHistory: matches.map((match) => ({
      id: normalizeId(match),
      status: match.status,
      tournamentId: normalizeId(match.tournamentId),
      createdAt: match.createdAt,
    })),
    highlights: posts.map((post) => sanitizePost(post)),
    engagement: {
      highlightAppearances: posts.length,
      commentsReceived,
    },
  };
}
