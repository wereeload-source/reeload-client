import { canOpen, homeFor, menuFor, NAV, ROLE_NAV } from "./nav";

describe("navigation by role", () => {
  it("sends each role to its first page", () => {
    expect(homeFor("admin")).toBe("/dashboard");
    expect(homeFor("sales")).toBe("/jobs");
    expect(homeFor("ops")).toBe("/assign");
    expect(homeFor("accounts")).toBe("/payments");
    expect(homeFor("reelmaker")).toBe("/m");
  });
  it("keeps admin-only pages away from other roles", () => {
    for (const role of ["sales", "ops", "accounts", "reelmaker"] as const) {
      expect(canOpen(role, "users")).toBe(false);
      expect(canOpen(role, "settings")).toBe(false);
      expect(canOpen(role, "dashboard")).toBe(false);
    }
    expect(canOpen("admin", "users")).toBe(true);
  });
  it("only shows money pages to money roles", () => {
    expect(ROLE_NAV.ops).not.toContain("payments");
    expect(ROLE_NAV.sales).toContain("payments");
  });
});

describe("menuFor", () => {
  it("lists each group once, so no heading repeats", () => {
    for (const role of ["admin", "sales", "ops", "accounts"] as const) {
      const groups = menuFor(role).map((k) => NAV[k].group).filter(Boolean);
      const runs = groups.filter((g, i) => g !== groups[i - 1]);
      expect(new Set(runs).size).toBe(runs.length);
    }
  });

  it("keeps the same pages as ROLE_NAV and the same home page", () => {
    expect([...menuFor("ops")].sort()).toEqual([...ROLE_NAV.ops].sort());
    expect(homeFor("ops")).toBe("/assign");
    expect(homeFor("sales")).toBe("/jobs");
  });
});
