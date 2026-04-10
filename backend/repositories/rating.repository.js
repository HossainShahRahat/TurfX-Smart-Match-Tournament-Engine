import connectToDatabase from "@/lib/db";
import Rating from "@/models/Rating";

export async function createRating(payload) {
  await connectToDatabase();
  return Rating.create(payload);
}

export async function findRating(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Rating.findOne(filter);

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function listRatings(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Rating.find(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.populatePlayers) {
    query = query.populate("raterPlayerId", "name");
    query = query.populate("ratedPlayerId", "name");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function countRatings(filter = {}) {
  await connectToDatabase();
  return Rating.countDocuments(filter);
}

export async function deleteRatings(filter = {}) {
  await connectToDatabase();
  return Rating.deleteMany(filter);
}
