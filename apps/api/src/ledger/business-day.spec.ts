import { businessDayBounds, businessDate } from "./business-day";

describe("business day boundaries", () => {
  it.each([
    [
      "2026-10-11",
      "America/Mexico_City",
      "2026-10-11T06:00:00.000Z",
      "2026-10-12T06:00:00.000Z",
    ],
    [
      "2026-10-11",
      "Asia/Tokyo",
      "2026-10-10T15:00:00.000Z",
      "2026-10-11T15:00:00.000Z",
    ],
  ])("maps %s in %s to UTC instants", (date, zone, start, end) => {
    expect(
      businessDayBounds(date, zone as string).map((d) => d.toISOString()),
    ).toEqual([start, end]);
  });

  it("assigns instants on either side of local midnight to separate dates", () => {
    expect(
      businessDate(new Date("2026-10-11T05:59:00Z"), "America/Mexico_City"),
    ).toBe("2026-10-10");
    expect(
      businessDate(new Date("2026-10-11T06:01:00Z"), "America/Mexico_City"),
    ).toBe("2026-10-11");
  });
});
