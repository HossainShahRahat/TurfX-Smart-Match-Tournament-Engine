import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

function readRuntimePorts() {
  try {
    const filePath = path.join(process.cwd(), "..", ".runtime", "ports.json");
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {};
  }
}

export async function GET() {
  const runtimePorts = readRuntimePorts();
  const fallbackUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.API_BASE_URL?.replace("127.0.0.1", "localhost") ||
    "http://localhost:4000";

  return NextResponse.json({
    url: runtimePorts.backend?.url || fallbackUrl,
  });
}
