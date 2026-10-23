import {
  dayStats,
  dhakaMonthKey,
  keptPercent,
  monthBalances,
  MonthlyTotals,
  shiftMonth,
} from "@trackingPortal/utils/carryOver";

/** Milliseconds for a wall-clock time in Dhaka (UTC+6). */
const dhaka = (iso: string) => Date.parse(`${iso}+06:00`);

// The design's numbers: ৳5,000 carried into August.
const DESIGN: MonthlyTotals = {
  "2026-07": { income: 55000, spent: 50000 },
  "2026-08": { income: 60000, spent: 19856 },
};

describe("monthBalances", () => {
  it("available = carry + income, remaining = available − spent", () => {
    const { current, previous } = monthBalances(DESIGN, "2026-08", true);
    expect(current).toEqual({
      month: "2026-08",
      carryOver: 5000,
      income: 60000,
      spent: 19856,
      available: 65000,
      remaining: 45144,
    });
    expect(previous).toMatchObject({ income: 55000, spent: 50000, remaining: 5000 });
  });

  it("gives zero carry over when last month broke even", () => {
    const totals = { "2026-07": { income: 40000, spent: 40000 }, "2026-08": { income: 60000, spent: 19856 } };
    const { current } = monthBalances(totals, "2026-08", true);
    expect(current.carryOver).toBe(0);
    expect(current.available).toBe(60000);
    expect(current.remaining).toBe(40144);
  });

  it("carries a negative balance and reduces remaining", () => {
    const totals = { "2026-07": { income: 52000, spent: 55000 }, "2026-08": { income: 60000, spent: 19856 } };
    const { current } = monthBalances(totals, "2026-08", true);
    expect(current.carryOver).toBe(-3000);
    expect(current.available).toBe(57000);
    expect(current.remaining).toBe(37144);
  });

  it("allows a negative remaining", () => {
    const totals = { "2026-08": { income: 20000, spent: 27500 } };
    expect(monthBalances(totals, "2026-08", true).current.remaining).toBe(-7500);
  });

  it("treats carry over as zero when the toggle is off", () => {
    const { current } = monthBalances(DESIGN, "2026-08", false);
    expect(current.carryOver).toBe(0);
    expect(current.available).toBe(60000);
    expect(current.remaining).toBe(40144);
  });

  it("starts the user's first month at zero", () => {
    expect(monthBalances(DESIGN, "2026-07", true).current.carryOver).toBe(0);
    expect(monthBalances({}, "2026-08", true).current).toMatchObject({ carryOver: 0, remaining: 0 });
  });

  it("carries nothing when last month had no income", () => {
    const totals = { "2026-07": { income: 0, spent: 66854 }, "2026-08": { income: 0, spent: 5000 } };
    const { current } = monthBalances(totals, "2026-08", true);
    expect(current.carryOver).toBe(0);
    expect(current.remaining).toBe(-5000);
  });

  it("only looks at last month, not further back", () => {
    const totals = {
      "2026-06": { income: 0, spent: 1000000 },
      "2026-07": { income: 10000, spent: 8000 },
    };
    expect(monthBalances(totals, "2026-08", true).current.carryOver).toBe(2000);
  });

  it("carries nothing across an empty month", () => {
    const totals = { "2026-06": { income: 1000, spent: 0 } };
    expect(monthBalances(totals, "2026-08", true).current.carryOver).toBe(0);
  });

  it("ignores later months when viewing a past one", () => {
    const { current } = monthBalances(DESIGN, "2026-07", true);
    expect(current).toMatchObject({ carryOver: 0, available: 55000, remaining: 5000 });
  });

  it("looks back across a year boundary", () => {
    const totals = { "2025-12": { income: 300, spent: 100 } };
    expect(monthBalances(totals, "2026-01", true).current.carryOver).toBe(200);
  });

  it("updates when a last-month entry is edited", () => {
    const before = monthBalances(DESIGN, "2026-08", true).current;
    // A July expense goes from 50,000 to 51,000.
    const edited = { ...DESIGN, "2026-07": { income: 55000, spent: 51000 } };
    const after = monthBalances(edited, "2026-08", true).current;
    expect(after.carryOver).toBe(before.carryOver - 1000);
    expect(after.remaining).toBe(before.remaining - 1000);
  });
});

describe("Asia/Dhaka months", () => {
  it("puts 23:59 on the last day in that month and 00:00 in the next", () => {
    expect(dhakaMonthKey(dhaka("2026-07-31T23:59:59"))).toBe("2026-07");
    expect(dhakaMonthKey(dhaka("2026-08-01T00:00:00"))).toBe("2026-08");
  });

  it("is ahead of UTC: 18:30 UTC on Jul 31 is already August", () => {
    expect(dhakaMonthKey(Date.parse("2026-07-31T18:30:00Z"))).toBe("2026-08");
  });

  it("shifts months across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
  });
});

describe("dayStats", () => {
  const AUG_5 = dhaka("2026-08-05T15:00:00");

  it("matches the design: 5 days passed, 27 left (today included)", () => {
    const stats = dayStats({ month: "2026-08", now: AUG_5, spent: 19856, remaining: 45144, limit: 70000 });
    expect(stats.dailyAvg).toBeCloseTo(3971.2);
    // min(50,144 limit left, 45,144 remaining) ÷ 27
    expect(stats.safePerDay).toBeCloseTo(45144 / 27);
  });

  it("uses limit left when the limit is lower than remaining", () => {
    const stats = dayStats({ month: "2026-08", now: AUG_5, spent: 19856, remaining: 45144, limit: 40000 });
    expect(Math.round(stats.safePerDay!)).toBe(746);
  });

  it("uses remaining when there is no limit", () => {
    const stats = dayStats({ month: "2026-08", now: AUG_5, spent: 19856, remaining: 45144, limit: 0 });
    expect(stats.safePerDay).toBeCloseTo(45144 / 27);
  });

  it("goes to zero or below when nothing is left", () => {
    const stats = dayStats({ month: "2026-08", now: AUG_5, spent: 27500, remaining: -7500, limit: 70000 });
    expect(stats.safePerDay!).toBeLessThanOrEqual(0);
  });

  it("counts days in Dhaka, not UTC", () => {
    // 20:00 UTC on Aug 4 is 02:00 on Aug 5 in Dhaka.
    const stats = dayStats({ month: "2026-08", now: Date.parse("2026-08-04T20:00:00Z"), spent: 500, remaining: 2700, limit: 0 });
    expect(stats.dailyAvg).toBe(100);
    expect(stats.safePerDay).toBe(100);
  });

  it("has no Safe / day for past months and averages over the whole month", () => {
    const stats = dayStats({ month: "2026-07", now: AUG_5, spent: 31000, remaining: 5000, limit: 0 });
    expect(stats.safePerDay).toBeNull();
    expect(stats.dailyAvg).toBe(1000);
  });
});

describe("keptPercent", () => {
  it("matches the design's 67%", () => {
    expect(keptPercent(60000, 19856)).toBe(67);
  });

  it("never goes below zero and handles no income", () => {
    expect(keptPercent(1000, 5000)).toBe(0);
    expect(keptPercent(0, 100)).toBe(0);
  });
});
