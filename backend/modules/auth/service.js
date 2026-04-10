import { HTTP_STATUS } from "@/config/constants";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from "@/repositories/user.repository";
import { signToken } from "@/utils/jwt";
import { comparePassword, hashPassword } from "@/utils/password";
import { createHttpError } from "@/utils/http-error";

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username || null,
    role: user.role,
    turfId: user.turfId || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(payload) {
  const normalizedEmail = payload.email.toLowerCase().trim();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw createHttpError(
      "User already exists with this email.",
      HTTP_STATUS.CONFLICT
    );
  }

  const hashedPassword = await hashPassword(payload.password);
  const user = await createUser({
    name: payload.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return sanitizeUser(user);
}

export async function loginUser(payload) {
  const identifier = String(payload.identifier || payload.email || "")
    .toLowerCase()
    .trim();
  const user =
    (await findUserByEmail(identifier, {
      includePassword: true,
    })) ||
    (await findUserByUsername(identifier, {
      includePassword: true,
    }));

  if (!user) {
    throw createHttpError(
      "Invalid email/username or password.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (user.status === "suspended") {
    throw createHttpError(
      "Account suspended. Please contact support.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  const isPasswordValid = await comparePassword(payload.password, user.password);

  if (!isPasswordValid) {
    throw createHttpError(
      "Invalid email/username or password.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
}
