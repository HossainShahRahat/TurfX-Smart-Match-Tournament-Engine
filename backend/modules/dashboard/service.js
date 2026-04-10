import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  DEFAULT_DASHBOARD_ROUTE_BY_ROLE,
  JWT_CONFIG,
  USER_ROLES,
} from "@/config/constants";
import { getServerApiBaseUrl } from "@/services/api-client";
import { getSessionUserFromCookies } from "@/utils/session";

import { assertDashboardApiResponse } from "./validator";

function buildBaseUrl(headerStore) {
  const configuredBaseUrl = getServerApiBaseUrl();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export async function requireRoleForDashboard(requiredRole) {
  const cookieStore = await cookies();
  const user = getSessionUserFromCookies(cookieStore);

  if (!user) {
    redirect("/dashboard");
  }

  if (user.role !== requiredRole) {
    redirect(DEFAULT_DASHBOARD_ROUTE_BY_ROLE[user.role] || "/dashboard");
  }

  return user;
}

export async function fetchDashboardApi(pathname) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_CONFIG.COOKIE_NAME)?.value;

  if (!token) {
    redirect("/dashboard");
  }

  const response = await fetch(`${buildBaseUrl(headerStore)}${pathname}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  assertDashboardApiResponse(response, `Failed to fetch ${pathname}`);

  const payload = await response.json();
  return payload.data;
}

export function getDashboardRouteForRole(role) {
  return DEFAULT_DASHBOARD_ROUTE_BY_ROLE[role] || "/dashboard";
}

export const roleRouteMap = {
  [USER_ROLES.ADMIN]: "/dashboard/admin",
  [USER_ROLES.TURF_OWNER]: "/dashboard/turf",
  [USER_ROLES.PLAYER]: "/dashboard/player",
};
