import { formatMoney, initials, safeHttpsUrl, timeAgo } from "./format";

describe("format", () => {
  it("formats rupees without decimals", () => {
    expect(formatMoney(1500)).toContain("1,500");
  });

  it("describes how long ago something happened", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    expect(timeAgo("2026-01-10T11:59:50Z", now)).toBe("just now");
    expect(timeAgo("2026-01-10T11:30:00Z", now)).toBe("30 min ago");
    expect(timeAgo("2026-01-10T09:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2026-01-07T12:00:00Z", now)).toBe("3 d ago");
    expect(timeAgo(null, now)).toBe("");
  });

  it("only accepts https links", () => {
    expect(safeHttpsUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(safeHttpsUrl("http://example.com")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
  });

  it("builds initials", () => {
    expect(initials("Riya Reviewer")).toBe("RR");
    expect(initials("  dana ")).toBe("D");
    expect(initials("")).toBe("?");
  });
});
