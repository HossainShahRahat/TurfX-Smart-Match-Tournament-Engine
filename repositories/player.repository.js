import connectToDatabase from "@/lib/db";
import Player from "@/models/Player";

export async function createPlayer(payload) {
  await connectToDatabase();
  return Player.create(payload);
}

export async function findPlayerById(id, options = {}) {
  await connectToDatabase();

  let query = Player.findById(id);

  if (options.populateUser) {
    query = query.populate("userId", "name email role");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findPlayerByUserId(userId, options = {}) {
  await connectToDatabase();

  let query = Player.findOne({ userId });

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function listPlayers(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Player.find(filter);

  if (options.populateUser) {
    query = query.populate("userId", "name email role");
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query.lean();
}

export async function updatePlayerStats(id, stats) {
  await connectToDatabase();

  return Player.findByIdAndUpdate(id, stats, {
    new: true,
    runValidators: true,
  });
}
