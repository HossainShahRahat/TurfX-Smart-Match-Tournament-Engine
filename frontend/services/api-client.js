export function buildApiUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  // If the app is calling a local API route ("/api/..."), prefer the
  // backend server URL so frontend dev server (localhost:3000) proxies
  // requests to the backend (default localhost:4000).
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  if (pathname.startsWith("/api/")) {
    return `${backendBase}${pathname}`;
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function apiFetch(pathname, options = {}) {
  return fetch(buildApiUrl(pathname), {
    credentials: "include",
    ...options,
  });
}
