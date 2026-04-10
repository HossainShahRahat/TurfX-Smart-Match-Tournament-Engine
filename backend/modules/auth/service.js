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
      HTTP_STATUS.CONFLICT,
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
  const password = payload.password;

  // Admin env check & auto-create
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (
    adminEmail &&
    adminPassword &&
    identifier === adminEmail.toLowerCase().trim() &&
    password === adminPassword
  ) {
    let adminUser = await findUserByEmail(identifier, {
      includePassword: true,
    });
    if (!adminUser || adminUser.role !== "admin") {
      // Create admin if not exists or wrong role
      const hashedPassword = await hashPassword(adminPassword);
      adminUser = await createUser({
        name: "Admin",
        email: identifier,
        password: hashedPassword,
        role: "admin",
        turfId: null,
      });
    }
    // Proceed to validate pw (will match since we just hashed or existing)
  }

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
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  if (user.status === "suspended") {
    throw createHttpError(
      "Account suspended. Please contact support.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError(
      "Invalid email/username or password.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
}
