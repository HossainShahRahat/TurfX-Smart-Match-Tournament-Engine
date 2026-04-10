import { verifyToken } from "@/utils/jwt";
import { JWT_CONFIG } from "@/config/constants";

export function getSessionUserFromCookies(cookieStore) {
  const token = cookieStore.get(JWT_CONFIG.COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
