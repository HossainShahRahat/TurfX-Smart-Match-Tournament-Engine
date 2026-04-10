export function buildApiUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function apiFetch(pathname, options = {}) {
  return fetch(buildApiUrl(pathname), {
    credentials: "include",
    ...options,
  });
}
