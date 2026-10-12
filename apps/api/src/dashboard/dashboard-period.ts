import { DashboardPeriod } from "@points-card/shared";
import { businessDate, businessDayBounds } from "../ledger/business-day";

const DAYS: Record<DashboardPeriod, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function dashboardPeriod(
  period: DashboardPeriod,
  now: Date,
  timeZone: string,
) {
  const today = businessDate(now, timeZone);
  const dates: string[] = [];
  const cursor = new Date(`${today}T12:00:00Z`);
  while (dates.length < DAYS[period]) {
    dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const startDate = dates[0];
  const previousCursor = new Date(`${startDate}T12:00:00Z`);
  const previous: string[] = [];
  while (previous.length < DAYS[period]) {
    previousCursor.setUTCDate(previousCursor.getUTCDate() - 1);
    previous.unshift(previousCursor.toISOString().slice(0, 10));
  }
  return {
    dates,
    start: businessDayBounds(dates[0], timeZone)[0],
    end: businessDayBounds(dates[dates.length - 1], timeZone)[1],
    previousStart: businessDayBounds(previous[0], timeZone)[0],
    previousEnd: businessDayBounds(previous[previous.length - 1], timeZone)[1],
  };
}

export function dateBounds(from: string, to: string, timeZone: string) {
  return [
    businessDayBounds(from, timeZone)[0],
    businessDayBounds(to, timeZone)[1],
  ] as const;
}
