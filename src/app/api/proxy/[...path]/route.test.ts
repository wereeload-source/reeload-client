import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (jar.has(n) ? { value: jar.get(n) } : undefined) }) }));

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const req = (url: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(new URL(url, "http://app.test"), init);

describe("API proxy route", () => {
  beforeEach(() => {
    jar.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json", "set-cookie": "x=1" } })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("adds the user's token from the httpOnly cookie and forwards only to the API", async () => {
    jar.set("reeload_access", "tok");
    const res = await GET(req("/api/proxy/jobs?status=paid"), ctx("jobs"));
    expect(res.status).toBe(200);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:4000/jobs?status=paid");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    // Upstream cookies are never passed back to the browser.
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("answers 401 without calling the API when not signed in", async () => {
    const res = await GET(req("/api/proxy/me"), ctx("me"));
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([[["..", "users"]], [["jobs", "%2e%2e"]], [["a b"]]])("refuses odd paths %j", async (path) => {
    jar.set("reeload_access", "tok");
    const res = await GET(req("/api/proxy/x"), ctx(...path));
    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses writes from another site", async () => {
    jar.set("reeload_access", "tok");
    const res = await POST(req("/api/proxy/users", { method: "POST", body: "{}", headers: { origin: "https://evil.example" } }), ctx("users"));
    expect(res.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses very large bodies", async () => {
    jar.set("reeload_access", "tok");
    const res = await POST(req("/api/proxy/contacts", { method: "POST", body: "x".repeat(1_000_001), headers: { origin: "http://app.test" } }), ctx("contacts"));
    expect(res.status).toBe(413);
  });

  it("turns an unreachable API into a clear 503", async () => {
    jar.set("reeload_access", "tok");
    vi.mocked(fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await GET(req("/api/proxy/jobs"), ctx("jobs"));
    expect(res.status).toBe(503);
    expect((await res.json()).message).toMatch(/Cannot reach the server/);
  });
});
