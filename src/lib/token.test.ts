import { accessExpiry, needsRefresh, safeNext } from "./token";

const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;

describe("safeNext (where to go after sign-in)", () => {
  it("keeps paths inside the app", () => {
    expect(safeNext("/jobs?s=paid")).toBe("/jobs?s=paid");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "jobs", "", null, undefined, "/ok\r\nSet-Cookie: x"])("refuses %s", (v) => {
    expect(safeNext(v as string)).toBe("/");
  });
  it("does not loop back to the login page", () => {
    expect(safeNext("/login?next=/x")).toBe("/");
  });
});

describe("access token expiry", () => {
  it("reads exp from the token", () => {
    expect(accessExpiry(jwt({ exp: 2_000_000_000 }))).toBe(2_000_000_000_000);
  });
  it("treats missing or garbled tokens as expired", () => {
    expect(accessExpiry(undefined)).toBe(0);
    expect(accessExpiry("not-a-token")).toBe(0);
    expect(needsRefresh("garbage")).toBe(true);
  });
  it("refreshes shortly before expiry, not long before", () => {
    const soon = Math.floor((Date.now() + 10_000) / 1000);
    const later = Math.floor((Date.now() + 10 * 60_000) / 1000);
    expect(needsRefresh(jwt({ exp: soon }))).toBe(true);
    expect(needsRefresh(jwt({ exp: later }))).toBe(false);
  });
});
