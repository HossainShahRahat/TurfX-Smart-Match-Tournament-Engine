import connectToDatabase from "@/lib/db";
import "@/models/SystemSettings";
import SystemSettings from "@/models/SystemSettings";

export async function getSettingByKey(key, options = {}) {
  await connectToDatabase();
  const query = SystemSettings.findOne({ key });
  return options.lean ? query.lean() : query;
}

export async function upsertSetting(key, payload) {
  await connectToDatabase();
  return SystemSettings.findOneAndUpdate(
    { key },
    { $set: payload },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function listSettings(filter = {}, options = {}) {
  await connectToDatabase();

  let query = SystemSettings.find(filter);

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

export async function countSettings(filter = {}) {
  await connectToDatabase();
  return SystemSettings.countDocuments(filter);
}

