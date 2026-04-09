export const roleMenus = {
  admin: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Users", href: "/dashboard/admin#users" },
    { label: "Matches", href: "/dashboard/admin#matches" },
    { label: "Settings", href: "/dashboard/admin#settings" },
  ],
  turf_owner: [
    { label: "Overview", href: "/dashboard/turf" },
    { label: "Sessions", href: "/dashboard/turf#sessions" },
    { label: "Matches", href: "/dashboard/turf#matches" },
    { label: "Tournaments", href: "/dashboard/turf#tournaments" },
  ],
  player: [
    { label: "Overview", href: "/dashboard/player" },
    { label: "Matches", href: "/dashboard/player#matches" },
    { label: "Tournaments", href: "/dashboard/player#tournaments" },
    { label: "Ranking", href: "/dashboard/player#ranking" },
  ],
};
