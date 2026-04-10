import connectToDatabase from "@/lib/db";
import Match from "@/models/Match";

export async function createMatch(payload) {
  await connectToDatabase();
  return Match.create(payload);
}

export async function listMatches(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Match.find(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.populatePlayers) {
    query = query.populate("teamA", "name totalGoals totalMatches skillRating");
    query = query.populate("teamB", "name totalGoals totalMatches skillRating");
  }

  if (options.populateCreator) {
    query = query.populate("createdBy", "name email role");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findMatchById(id, options = {}) {
  await connectToDatabase();

  let query = Match.findById(id);

  if (options.populatePlayers) {
    query = query.populate("teamA", "name totalGoals totalMatches skillRating");
    query = query.populate("teamB", "name totalGoals totalMatches skillRating");
  }

  if (options.populateCreator) {
    query = query.populate("createdBy", "name email role");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function updateMatch(id, payload) {
  await connectToDatabase();

  return Match.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
}

export async function deleteMatchById(id) {
  await connectToDatabase();
  return Match.findByIdAndDelete(id);
}
