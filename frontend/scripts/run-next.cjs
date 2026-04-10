const { spawn } = require("child_process");
const path = require("path");

const { findAvailablePort, writeRuntimePorts } = require("../../scripts/runtime-ports.cjs");

async function main() {
  const mode = process.argv[2] || "dev";
  const preferredPort = Number(process.env.PORT || 3000);
  const resolvedPort = await findAvailablePort(preferredPort, "0.0.0.0");

  process.env.PORT = String(resolvedPort);
  process.env.__TURFX_FRONTEND_PORT__ = String(resolvedPort);

  writeRuntimePorts({
    frontend: {
      port: resolvedPort,
      url: `http://localhost:${resolvedPort}`,
    },
  });

  if (resolvedPort !== preferredPort) {
    console.log(`Preferred frontend port ${preferredPort} was busy. Using ${resolvedPort} instead.`);
  }

  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, mode, "-p", String(resolvedPort)], {
    cwd: path.join(__dirname, ".."),
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("Failed to start frontend:", error);
  process.exit(1);
});
