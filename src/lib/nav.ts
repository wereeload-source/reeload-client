import type { Role } from "@/lib/types";

export type NavKey = "dashboard" | "jobs" | "assign" | "calendar" | "review" | "payments" | "contacts" | "team" | "users" | "settings";

export const NAV: Record<NavKey, { label: string; href: string; group: string }> = {
  dashboard: { label: "Dashboard", href: "/dashboard", group: "" },
  jobs: { label: "Jobs", href: "/jobs", group: "Work" },
  assign: { label: "Assign shoots", href: "/assign", group: "Work" },
  calendar: { label: "Calendar", href: "/calendar", group: "Work" },
  review: { label: "Review & delivery", href: "/review", group: "Work" },
  contacts: { label: "Contact log", href: "/contacts", group: "Sales" },
  payments: { label: "Payments", href: "/payments", group: "Money" },
  team: { label: "Reelmakers", href: "/team", group: "Team" },
  users: { label: "Users", href: "/users", group: "Admin" },
  settings: { label: "Settings", href: "/settings", group: "Admin" },
};

/**
 * Which console pages each office role sees. This only shapes the menu: the API decides what each
 * role may actually read or change, so a hidden page is never the only protection.
 */
export const ROLE_NAV: Record<Exclude<Role, "reelmaker">, NavKey[]> = {
  admin: ["dashboard", "jobs", "assign", "calendar", "review", "team", "payments", "contacts", "users", "settings"],
  sales: ["jobs", "contacts", "calendar", "payments"],
  ops: ["assign", "calendar", "review", "team", "jobs"],
  accounts: ["payments"],
};

export const homeFor = (role: Role): string => (role === "reelmaker" ? "/m" : NAV[ROLE_NAV[role][0]].href);

/** True when `role` may open the console page at `key`. */
export const canOpen = (role: Role, key: NavKey): boolean => role !== "reelmaker" && ROLE_NAV[role].includes(key);
