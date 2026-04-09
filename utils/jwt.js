import jwt from "jsonwebtoken";

import { JWT_CONFIG } from "@/config/constants";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable.");
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
