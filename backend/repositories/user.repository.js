import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function findUserByEmail(email, options = {}) {
  await connectToDatabase();

  let query = User.findOne({ email });

  if (options.includePassword) {
    query = query.select("+password");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findUserByUsername(username, options = {}) {
  await connectToDatabase();

  let query = User.findOne({ username });

  if (options.includePassword) {
    query = query.select("+password");
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function createUser(payload) {
  await connectToDatabase();
  return User.create(payload);
}

export async function findUserById(id, options = {}) {
  await connectToDatabase();
  const query = User.findById(id).select(options.select || "name email role turfId status suspendedAt suspensionReason createdAt updatedAt");
  return options.lean ? query.lean() : query;
}

export async function listUsers(filter = {}, options = {}) {
  await connectToDatabase();

  let query = User.find(filter).select(
    options.select || "name email username role turfId createdAt updatedAt"
  );

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.skip) {
    query = query.skip(options.skip);
  }

  return query.lean();
}

export async function updateUserById(id, payload) {
  await connectToDatabase();
  return User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function countUsers(filter = {}) {
  await connectToDatabase();
  return User.countDocuments(filter);
}
