import connectToDatabase from "@/lib/db";
import Event from "@/models/Event";

export async function createEvent(payload) {
  await connectToDatabase();
  return Event.create(payload);
}

export async function listEvents(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Event.find(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.populatePlayer) {
    query = query.populate("playerId", "name");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findEvent(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Event.findOne(filter);

  if (options.lean) {
    return query.lean();
  }

  return query;
}
