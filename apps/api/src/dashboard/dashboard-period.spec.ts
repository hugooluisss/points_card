import { dashboardPeriod } from "./dashboard-period";

describe("dashboardPeriod", () => {
  it.each([
    [
      "Sunday",
      "2026-10-11T18:00:00.000Z",
      [
        "2026-10-05",
        "2026-10-06",
        "2026-10-07",
        "2026-10-08",
        "2026-10-09",
        "2026-10-10",
        "2026-10-11",
      ],
    ],
    [
      "Monday",
      "2026-10-12T18:00:00.000Z",
      [
        "2026-10-06",
        "2026-10-07",
        "2026-10-08",
        "2026-10-09",
        "2026-10-10",
        "2026-10-11",
        "2026-10-12",
      ],
    ],
  ])("returns consecutive calendar days ending on %s", (_day, now, dates) => {
    const result = dashboardPeriod("7d", new Date(now), "America/Mexico_City");
    expect(result.dates).toEqual(dates);
    expect(result.dates).toHaveLength(7);
    expect(new Date(result.previousEnd).getTime()).toBe(
      new Date(result.start).getTime(),
    );
  });

  it("switches the business date across the Mexico City local-midnight boundary", () => {
    const before = dashboardPeriod(
      "7d",
      new Date("2026-10-11T05:59:00.000Z"),
      "America/Mexico_City",
    );
    const after = dashboardPeriod(
      "7d",
      new Date("2026-10-11T06:01:00.000Z"),
      "America/Mexico_City",
    );
    expect(before.dates.at(-1)).toBe("2026-10-10");
    expect(after.dates.at(-1)).toBe("2026-10-11");
  });
});
