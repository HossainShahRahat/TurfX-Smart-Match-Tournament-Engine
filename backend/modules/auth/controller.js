import { HTTP_STATUS, JWT_CONFIG } from "@/config/constants";
import { errorResponse, successResponse } from "@/utils/api-response";

import { loginUser, registerUser } from "./service";
import {
  parseJsonBody,
  validateLoginPayload,
  validateRegisterPayload,
} from "./validator";

export async function registerController(request) {
  try {
    return errorResponse(
      { message: "Self-service registration is disabled. Ask an admin to create your account.", statusCode: HTTP_STATUS.FORBIDDEN },
      "Failed to register user."
    );
  } catch (error) {
    return errorResponse(error, "Failed to register user.");
  }
}

export async function loginController(request) {
  try {
    const body = await parseJsonBody(request);
    validateLoginPayload(body);

    const result = await loginUser(body);
    const response = successResponse(result, "Login successful.", HTTP_STATUS.OK);

    response.cookies.set(JWT_CONFIG.COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_CONFIG.MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    return errorResponse(error, "Failed to log in.");
  }
}
