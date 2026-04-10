import connectToDatabase from "@/lib/db";
import "@/models/AuditLog";
import AuditLog from "@/models/AuditLog";

export async function createAuditLog(payload) {
  await connectToDatabase();
  return AuditLog.create(payload);
}

export async function listAuditLogs(filter = {}, options = {}) {
  await connectToDatabase();

  let query = AuditLog.find(filter);

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

export async function countAuditLogs(filter = {}) {
  await connectToDatabase();
  return AuditLog.countDocuments(filter);
}

