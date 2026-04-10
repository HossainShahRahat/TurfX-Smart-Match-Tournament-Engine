const CLIENT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SERVER_API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export function buildApiUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  return `${CLIENT_API_BASE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function getServerApiBaseUrl() {
  return SERVER_API_BASE_URL;
}

export function getSocketServerUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL || CLIENT_API_BASE_URL;
}

export function apiFetch(pathname, options = {}) {
  return fetch(buildApiUrl(pathname), {
    credentials: "include",
    ...options,
  });
}
