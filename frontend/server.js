const { createServer } = require("http");

const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = !process.argv.includes("--prod");
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

function parseCookies(header = "") {
  return header
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex);
      const value = entry.slice(separatorIndex + 1);
      cookies[key] = decodeURIComponent(value);

      return cookies;
    }, {});
}

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, nextMiddleware) => {
    const token =
      socket.handshake.auth?.token ||
      parseCookies(socket.handshake.headers.cookie).token;

    if (!token) {
      socket.data.user = null;
      nextMiddleware();
      return;
    }

    try {
      socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
      nextMiddleware();
    } catch (error) {
      nextMiddleware(new Error("Unauthorized socket connection."));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connection:state", {
      connected: true,
      socketId: socket.id,
      user: socket.data.user || null,
    });

    socket.on("match:join", (matchId) => {
      if (typeof matchId !== "string" || !matchId.trim()) {
        return;
      }

      socket.join(matchId);
      socket.emit("match:joined", { matchId });
    });

    socket.on("match:leave", (matchId) => {
      if (typeof matchId !== "string" || !matchId.trim()) {
        return;
      }

      socket.leave(matchId);
      socket.emit("match:left", { matchId });
    });
  });

  global.__TURFX_IO__ = io;

  return io;
}

app
  .prepare()
  .then(() => {
    const httpServer = createServer((request, response) => {
      handle(request, response);
    });

    createSocketServer(httpServer);

    httpServer.listen(port, hostname, () => {
      console.log(
        `> TurfX server ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to start TurfX server:", error);
    process.exit(1);
  });
