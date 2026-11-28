import { partSize, withRetry } from "./uploader";

const MB = 1024 * 1024;

describe("uploader", () => {
  it("uses 8 MB parts for normal files and bigger parts so huge files stay under 10,000 parts", () => {
    expect(partSize(100 * MB)).toBe(8 * MB);
    const huge = 200 * 1024 * MB;
    expect(Math.ceil(huge / partSize(huge))).toBeLessThanOrEqual(10_000);
  });
  it("retries a failing step, then gives up with the last error", async () => {
    let n = 0;
    const ok = await withRetry(async () => (++n < 3 ? Promise.reject(new Error("drop")) : "etag"), new AbortController().signal, 4, 1);
    expect(ok).toBe("etag");
    await expect(withRetry(() => Promise.reject(new Error("down")), new AbortController().signal, 2, 1)).rejects.toThrow("down");
  });
  it("stops retrying once cancelled", async () => {
    const c = new AbortController();
    c.abort();
    let n = 0;
    await expect(withRetry(async () => { n++; throw new Error("x"); }, c.signal, 5, 1)).rejects.toThrow("x");
    expect(n).toBe(1);
  });
});
