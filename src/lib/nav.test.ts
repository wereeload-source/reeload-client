import { canOpen, homeFor, mayOpenPath, menuFor, NAV, ROLE_NAV } from "./nav";

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
  it("lists the role's pages in menu order, home page first", () => {
    expect(menuFor("ops")[0]).toBe("assign");
    expect(menuFor("ops").map((k) => NAV[k].label)).toEqual(["Unassigned", "Calendar", "Review files", "Reelmakers and leave", "Jobs"]);
    expect(new Set(menuFor("admin")).size).toBe(menuFor("admin").length);
  });
});

describe("mayOpenPath", () => {
  it("lets each role open only its own pages and the account page", () => {
    expect(mayOpenPath("sales", "/users")).toBe(false);
    expect(mayOpenPath("sales", "/jobs/new")).toBe(true);
    expect(mayOpenPath("ops", "/jobs/new")).toBe(false);
    expect(mayOpenPath("ops", "/jobs/abc")).toBe(true);
    expect(mayOpenPath("accounts", "/payments/receipt/x")).toBe(true);
    expect(mayOpenPath("accounts", "/jobs")).toBe(false);
    expect(mayOpenPath("accounts", "/account")).toBe(true);
    expect(mayOpenPath("admin", "/settings")).toBe(true);
  });
});
