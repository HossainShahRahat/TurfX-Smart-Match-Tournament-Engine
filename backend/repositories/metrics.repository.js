import mongoose from "mongoose";

import connectToDatabase from "@/lib/db";
import { COLLECTION_NAMES } from "@/config/constants";
import "@/models/Player";

function getRegisteredModel(name) {
  return mongoose.models[name] || null;
}

async function hasCollection(name) {
  await connectToDatabase();
  return mongoose.connection.db.listCollections({ name }).hasNext();
}

export async function countDocumentsByModel(modelName, filter = {}) {
  await connectToDatabase();

  const model = getRegisteredModel(modelName);

  if (model) {
    return model.countDocuments(filter);
  }

  const fallbackCollectionName = COLLECTION_NAMES[modelName.toUpperCase()];

  if (!fallbackCollectionName || !(await hasCollection(fallbackCollectionName))) {
    return 0;
  }

  return mongoose.connection.db.collection(fallbackCollectionName).countDocuments(filter);
}

export async function findTopPlayers(limit = 5) {
  await connectToDatabase();

  const playerModel = getRegisteredModel("Player");

  if (!playerModel) {
    return [];
  }

  return playerModel
    .find({})
    .select("name skillRating totalGoals totalMatches averagePeerRating manOfTheMatchCount ranking")
    .sort({ skillRating: -1, totalGoals: -1 })
    .limit(limit)
    .lean();
}

export async function findPlayerProfileByUserId(userId) {
  await connectToDatabase();

  const playerModel = getRegisteredModel("Player");

  if (!playerModel) {
    return null;
  }

  return playerModel.findOne({ userId }).lean();
}
