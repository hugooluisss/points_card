export function businessDayBounds(
  date: string,
  timeZone: string,
): [Date, Date] {
  const [year, month, day] = date.split("-").map(Number);
  const midnight = (dayOffset: number) => {
    const utc = new Date(Date.UTC(year, month - 1, day + dayOffset));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(utc);
    const localAsUtc = Date.UTC(
      Number(parts.find((p) => p.type === "year")!.value),
      Number(parts.find((p) => p.type === "month")!.value) - 1,
      Number(parts.find((p) => p.type === "day")!.value),
      Number(parts.find((p) => p.type === "hour")!.value),
      Number(parts.find((p) => p.type === "minute")!.value),
      Number(parts.find((p) => p.type === "second")!.value),
    );
    return new Date(utc.getTime() - (localAsUtc - utc.getTime()));
  };
  return [midnight(0), midnight(1)];
}

export function businessDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
