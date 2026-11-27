export type Role = "admin" | "sales" | "ops" | "reelmaker" | "accounts";

export type JobStatus =
  | "lead" | "draft" | "confirmed" | "assigned" | "accepted" | "reached"
  | "uploaded" | "released" | "paid" | "delivered" | "closed" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role;
  active: boolean;
}

export interface Job {
  id: string;
  code: string;
  status: JobStatus;
  city: string;
  address: string | null;
  maps_url: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  onsite_contact_name: string | null;
  onsite_contact_phone: string | null;
  brief: string | null;
  consent: boolean;
  created_at: string;
  confirmed_at: string | null;
  clients?: { name: string; phone: string } | null;
  assignments?: { id: string; reelmaker_id: string; status: string; profiles?: { full_name: string } | null }[];
}

export const PIPELINE: JobStatus[] = [
  "lead", "confirmed", "assigned", "accepted", "reached", "uploaded", "released", "paid", "delivered", "closed",
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin", sales: "Sales", ops: "Operations", reelmaker: "Reelmaker", accounts: "Accounts",
};

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

/** Which console pages each office role sees (the mockup's role switcher). */
export const ROLE_NAV: Record<Exclude<Role, "reelmaker">, NavKey[]> = {
  admin: ["dashboard", "jobs", "assign", "calendar", "review", "team", "payments", "contacts", "users", "settings"],
  sales: ["jobs", "contacts", "calendar"],
  ops: ["assign", "calendar", "review", "team"],
  accounts: ["payments", "team", "jobs"],
};

export const homeFor = (role: Role) => (role === "reelmaker" ? "/m" : ROLE_NAV[role][0] && NAV[ROLE_NAV[role][0]].href);

/** Standard select for job lists: client name and the reelmaker on each assignment. */
export const JOB_SELECT =
  "*, clients(name, phone), assignments(id, reelmaker_id, status, profiles!assignments_reelmaker_id_fkey(full_name))";

export const liveAssignment = (j: Job) => j.assignments?.find((a) => a.status === "pending" || a.status === "accepted");
