import { canOpen, homeFor, ROLE_NAV } from "./nav";

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
