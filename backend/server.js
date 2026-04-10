const fs = require("fs");
const { createServer } = require("http");
const path = require("path");

const next = require("next");
const { Server } = require("socket.io");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function applyCors(request, response) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const requestOrigin = request.headers.origin;
  const origin = requestOrigin && requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin;

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With"
  );
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
}

loadEnvFile(path.join(__dirname, ".env"));
process.env.NEXT_DIST_DIR = ".next-backend";

const dev = !process.argv.includes("--prod");
const hostname = "0.0.0.0";
const port = Number(process.env.BACKEND_PORT || 4000);
const frontendDir = path.join(__dirname, "..", "frontend");

const app = next({
  dev,
  hostname,
  port,
  dir: frontendDir,
});
const handle = app.getRequestHandler();

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

  global.__TURFX_IO__ = io;
  return io;
}

app
  .prepare()
  .then(() => {
    const httpServer = createServer((request, response) => {
      if (request.url?.startsWith("/api/")) {
        applyCors(request, response);

        if (request.method === "OPTIONS") {
          response.writeHead(204);
          response.end();
          return;
        }
      }

      handle(request, response);
    });

    createSocketServer(httpServer);

    httpServer.listen(port, hostname, () => {
      console.log(
        `> TurfX backend ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to start TurfX backend:", error);
    process.exit(1);
  });
