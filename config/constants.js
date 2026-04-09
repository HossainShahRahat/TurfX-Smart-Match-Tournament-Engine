export const USER_ROLES = {
  ADMIN: "admin",
  TURF_OWNER: "turf_owner",
  PLAYER: "player",
};

export const JWT_CONFIG = {
  COOKIE_NAME: "token",
  EXPIRES_IN: "7d",
  MAX_AGE_SECONDS: 60 * 60 * 24 * 7,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const DEFAULT_DASHBOARD_ROUTE_BY_ROLE = {
  [USER_ROLES.ADMIN]: "/dashboard/admin",
  [USER_ROLES.TURF_OWNER]: "/dashboard/turf",
  [USER_ROLES.PLAYER]: "/dashboard/player",
};

export const COLLECTION_NAMES = {
  EVENT: "events",
  MATCH: "matches",
  TOURNAMENT: "tournaments",
  PLAYER: "players",
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const MATCH_STATUS = {
  PENDING: "pending",
  LIVE: "live",
  FINISHED: "finished",
};

export const MATCH_EVENT_TYPES = {
  GOAL: "goal",
  YELLOW_CARD: "yellow_card",
  RED_CARD: "red_card",
  SUBSTITUTION: "substitution",
};

export const TOURNAMENT_TYPES = {
  LEAGUE: "league",
  KNOCKOUT: "knockout",
  HYBRID: "hybrid",
};

export const TOURNAMENT_STATUS = {
  UPCOMING: "upcoming",
  ACTIVE: "active",
  COMPLETED: "completed",
};
