import { fileSize, hours, initials, inr, istInstant, num, statusLabel } from "./format";

describe("formatting", () => {
  it("shows rupees in the Indian style and a dash for nothing", () => {
    expect(inr("150000.00")).toBe("₹1,50,000");
    expect(inr(null)).toBe("—");
    expect(num("12.50")).toBe(12.5);
    expect(num(null)).toBe(0);
  });
  it("builds an IST instant from a date and a time, or nothing", () => {
    expect(istInstant("2026-12-03", "09:30")).toBe("2026-12-03T09:30:00+05:30");
    expect(istInstant("2026-12-03", "")).toBeNull();
    expect(istInstant("03/12/2026", "09:30")).toBeNull();
  });
  it("writes durations, sizes, initials and status names", () => {
    expect(hours(150)).toBe("2.5h");
    expect(hours(120)).toBe("2h");
    expect(fileSize(2_500_000_000)).toBe("2.5 GB");
    expect(initials("Ravi  Reelmaker")).toBe("RR");
    expect(initials("")).toBe("?");
    expect(statusLabel("follow_up")).toBe("Follow up");
  });
});
