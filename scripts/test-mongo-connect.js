// scripts/test-mongo-connect.js
// Loads backend/.env and attempts to connect to MongoDB using mongoose.
// Run from the repo root with: node .\scripts\test-mongo-connect.js

const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i === -1) continue;
    const k = l.slice(0, i).trim();
    const v = l.slice(i + 1).trim();
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

loadEnv(path.join(__dirname, "..", "backend", ".env"));

// Try to load mongoose from local context first. If not available, try
// to require it relative to the backend package so the script works from
// repo root, frontend, or backend folders.
let mongoose;
try {
  mongoose = require("mongoose");
} catch (err) {
  try {
    const { createRequire } = require("module");
    const backendPkg = path.join(__dirname, "..", "backend", "package.json");
    const backendRequire = createRequire(backendPkg);
    mongoose = backendRequire("mongoose");
  } catch (inner) {
    console.error(
      "Cannot load mongoose. Install backend dependencies with:\n  npm --prefix backend install",
    );
    process.exit(3);
  }
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("No MONGODB_URI found in backend/.env");
  process.exit(2);
}

console.log(
  "Using MONGODB_URI from backend/.env (hidden). Attempting connection...",
);

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log("MongoDB connected successfully.");
    return mongoose.disconnect();
  })
  .catch((err) => {
    console.error("MongoDB connection error:");
    console.error(err);
    process.exit(1);
  });
