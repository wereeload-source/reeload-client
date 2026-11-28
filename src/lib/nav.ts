import type { Role } from "@/lib/types";

export type NavKey = "dashboard" | "jobs" | "assign" | "calendar" | "review" | "payments" | "contacts" | "team" | "users" | "settings";

/** Console pages, named as in the approved mockups. */
export const NAV: Record<NavKey, { label: string; href: string }> = {
  dashboard: { label: "Dashboard", href: "/dashboard" },
  jobs: { label: "Jobs", href: "/jobs" },
  calendar: { label: "Calendar", href: "/calendar" },
  assign: { label: "Unassigned", href: "/assign" },
  review: { label: "Review files", href: "/review" },
  team: { label: "Reelmakers and leave", href: "/team" },
  payments: { label: "Payments", href: "/payments" },
  contacts: { label: "Contact log", href: "/contacts" },
  users: { label: "Users", href: "/users" },
  settings: { label: "Settings", href: "/settings" },
};

/**
 * Which console pages each office role sees, in menu order; the first is the role's home page.
 * This only shapes the menu: the API decides what each role may actually read or change.
 */
export const ROLE_NAV: Record<Exclude<Role, "reelmaker">, NavKey[]> = {
  admin: ["dashboard", "jobs", "calendar", "assign", "payments", "review", "team", "contacts", "users", "settings"],
  sales: ["jobs", "contacts", "calendar", "payments"],
  ops: ["assign", "calendar", "review", "team", "jobs"],
  accounts: ["payments"],
};

export const menuFor = (role: Exclude<Role, "reelmaker">): NavKey[] => ROLE_NAV[role];

export const homeFor = (role: Role): string => (role === "reelmaker" ? "/m" : NAV[ROLE_NAV[role][0]].href);

/** True when `role` may open the console page at `key`. */
export const canOpen = (role: Role, key: NavKey): boolean => role !== "reelmaker" && ROLE_NAV[role].includes(key);

/**
 * Whether `role` may open the console page at `path` (checked in the console layout, before the
 * page streams, so a refused page is a real redirect). "My account" is open to every office role.
 */
export function mayOpenPath(role: Role, path: string): boolean {
  if (role === "reelmaker") return false;
  const first = path.split("/")[1] ?? "";
  if (first === "account" || first === "") return true;
  if (path === "/jobs/new" || path.startsWith("/jobs/new/")) return role === "admin" || role === "sales";
  const key = (Object.keys(NAV) as NavKey[]).find((k) => NAV[k].href === `/${first}`);
  return key ? canOpen(role, key) : true;
}
