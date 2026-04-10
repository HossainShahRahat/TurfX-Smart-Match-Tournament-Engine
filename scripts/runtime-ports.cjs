const fs = require("fs");
const net = require("net");
const path = require("path");

const runtimeDir = path.join(__dirname, "..", ".runtime");
const runtimeFile = path.join(runtimeDir, "ports.json");

function ensureRuntimeDir() {
  fs.mkdirSync(runtimeDir, { recursive: true });
}

function readRuntimePorts() {
  try {
    return JSON.parse(fs.readFileSync(runtimeFile, "utf8"));
  } catch (error) {
    return {};
  }
}

function writeRuntimePorts(nextState) {
  ensureRuntimeDir();
  const currentState = readRuntimePorts();

  fs.writeFileSync(
    runtimeFile,
    JSON.stringify(
      {
        ...currentState,
        ...nextState,
      },
      null,
      2
    )
  );
}

function findAvailablePort(preferredPort, hostname = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    let candidatePort = Number(preferredPort) || 0;

    function tryListen() {
      const server = net.createServer();

      server.unref();

      server.once("error", (error) => {
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          candidatePort += 1;
          tryListen();
          return;
        }

        reject(error);
      });

      server.listen(candidatePort, hostname, () => {
        const address = server.address();
        const resolvedPort =
          typeof address === "object" && address ? address.port : candidatePort;

        server.close(() => resolve(resolvedPort));
      });
    }

    tryListen();
  });
}

module.exports = {
  findAvailablePort,
  readRuntimePorts,
  runtimeFile,
  writeRuntimePorts,
};
