import { HTTP_STATUS } from "@/config/constants";
import { createHttpError } from "@/utils/http-error";

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError("Invalid JSON payload.", HTTP_STATUS.BAD_REQUEST);
  }
}

export function validateRegisterPayload({ name, email, password }) {
  if (!name || !email || !password) {
    throw createHttpError(
      "Name, email, and password are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (typeof password !== "string" || password.length < 6) {
    throw createHttpError(
      "Password must be at least 6 characters long.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

export function validateLoginPayload({ email, password }) {
  if (!email || !password) {
    throw createHttpError(
      "Email and password are required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
}
