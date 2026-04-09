import connectToDatabase from "@/lib/db";
import Tournament from "@/models/Tournament";

export async function createTournament(payload) {
  await connectToDatabase();
  return Tournament.create(payload);
}

export async function listTournaments(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Tournament.find(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.populateMatches) {
    query = query.populate("matches");
  }

  if (options.populateCreator) {
    query = query.populate("createdBy", "name email role");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findTournamentById(id, options = {}) {
  await connectToDatabase();

  let query = Tournament.findById(id);

  if (options.populateMatches) {
    query = query.populate("matches");
  }

  if (options.populateCreator) {
    query = query.populate("createdBy", "name email role");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function updateTournament(id, payload) {
  await connectToDatabase();

  return Tournament.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
}
