import mongoose from "mongoose";

import connectToDatabase from "@/lib/db";
import { MATCH_STATUS, TOURNAMENT_STATUS } from "@/config/constants";
import { countUsers } from "@/repositories/user.repository";
import { countDocumentsByModel, findTopPlayers } from "@/repositories/metrics.repository";
import { listMatches } from "@/repositories/match.repository";
import { listTournaments } from "@/repositories/tournament.repository";
import { listPosts } from "@/repositories/feed.repository";

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildDailyBuckets(days) {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    buckets.push({
      date: day.toISOString().slice(0, 10),
      users: 0,
      matches: 0,
      tournaments: 0,
      posts: 0,
    });
  }
  return buckets;
}

async function countActiveUsers(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return countUsers({ updatedAt: { $gte: since } });
}

async function aggregateGrowthTrends(days = 14) {
  await connectToDatabase();
  const buckets = buildDailyBuckets(days);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const models = {
    users: mongoose.models.User,
    matches: mongoose.models.Match,
    tournaments: mongoose.models.Tournament,
    posts: mongoose.models.Post,
  };

  const results = {};

  for (const [key, model] of Object.entries(models)) {
    if (!model) {
      results[key] = [];
      continue;
    }

    results[key] = await model
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }

  const lookup = new Map(buckets.map((b) => [b.date, b]));
  for (const row of results.users) {
    const bucket = lookup.get(row._id);
    if (bucket) bucket.users = row.count;
  }
  for (const row of results.matches) {
    const bucket = lookup.get(row._id);
    if (bucket) bucket.matches = row.count;
  }
  for (const row of results.tournaments) {
    const bucket = lookup.get(row._id);
    if (bucket) bucket.tournaments = row.count;
  }
  for (const row of results.posts) {
    const bucket = lookup.get(row._id);
    if (bucket) bucket.posts = row.count;
  }

  return buckets;
}

export async function getAdminSuperOverview(options = {}) {
  const days = Math.min(Math.max(Number(options.days) || 14, 7), 30);

  const [
    totalUsers,
    activeUsers7d,
    totalMatchesPlayed,
    totalTournamentsCreated,
    topPlayers,
    mostLikedPosts,
    growthTrends,
  ] = await Promise.all([
    countUsers(),
    countActiveUsers(7),
    countDocumentsByModel("Match", { status: MATCH_STATUS.FINISHED }),
    countDocumentsByModel("Tournament"),
    findTopPlayers(5),
    listPosts({}, { sort: { likesCount: -1, createdAt: -1 }, limit: 5, lean: true }),
    aggregateGrowthTrends(days),
  ]);

  return {
    totalUsers,
    activeUsers7d,
    totalMatchesPlayed,
    totalTournamentsCreated,
    activeTournaments: await countDocumentsByModel("Tournament", { status: TOURNAMENT_STATUS.ACTIVE }),
    topPlayers,
    mostLikedPosts: mostLikedPosts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      type: post.type,
      createdAt: post.createdAt,
    })),
    growthTrends,
  };
}

export async function listAdminMatches(options = {}) {
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

  return matches.map((match) => ({
    id: match._id.toString(),
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    createdBy: match.createdBy
      ? {
          id: match.createdBy._id?.toString?.() || null,
          name: match.createdBy.name,
          email: match.createdBy.email,
          role: match.createdBy.role,
        }
      : null,
    tournamentId: match.tournamentId?.toString?.() || null,
    teamA: (match.teamA || []).map((p) => ({ id: p._id.toString(), name: p.name })),
    teamB: (match.teamB || []).map((p) => ({ id: p._id.toString(), name: p.name })),
  }));
}

export async function listAdminTournaments(options = {}) {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const tournaments = await listTournaments(
    {},
    {
      sort: { createdAt: -1 },
      populateCreator: true,
      skip,
      limit,
      lean: true,
    }
  );

  return tournaments.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    type: t.type,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    createdBy: t.createdBy
      ? {
          id: t.createdBy._id?.toString?.() || null,
          name: t.createdBy.name,
          email: t.createdBy.email,
          role: t.createdBy.role,
        }
      : null,
    matchesCount: Array.isArray(t.matches) ? t.matches.length : 0,
    teamsCount: Array.isArray(t.teams) ? t.teams.length : 0,
  }));
}

