import { HTTP_STATUS, JWT_CONFIG } from "@/config/constants";
import { verifyToken } from "@/utils/jwt";
import { createHttpError } from "@/utils/http-error";

export function extractTokenFromRequest(request) {
  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.split(" ")[1];
  }

  const cookieToken = request.cookies.get(JWT_CONFIG.COOKIE_NAME)?.value;

  if (cookieToken) {
    return cookieToken;
  }

  throw createHttpError(
    "Authorization token is required.",
    HTTP_STATUS.UNAUTHORIZED
  );
}

export function authenticateRequest(request) {
  try {
    const token = extractTokenFromRequest(request);
    return verifyToken(token);
  } catch (error) {
    throw createHttpError(
      "Invalid or expired token.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }
}

export function authorizeRoles(request, allowedRoles = []) {
  const user = authenticateRequest(request);

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw createHttpError(
      "You are not authorized to access this resource.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  return user;
}
