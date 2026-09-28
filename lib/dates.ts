// All dates in the app follow Ecuador time (UTC-5, no daylight saving).
//
// Activity "days" are stored as UTC midnight of the Ecuador calendar day
// (e.g. 2026-09-27T00:00:00Z means "27/9 in Ecuador"), so they must be
// formatted in UTC to show the right day. Real timestamps (createdAt,
// changedAt, "now") are formatted in Ecuador's time zone.

export const ECUADOR_TZ = "America/Guayaquil";

// Today's date in Ecuador as YYYY-MM-DD
export function ecuadorToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ECUADOR_TZ }).format(new Date());
}

// UTC range covering today's stored activity day
export function ecuadorTodayRange() {
  const start = new Date(`${ecuadorToday()}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

// Format a stored activity day (UTC midnight) as d/m/yyyy
export function formatDay(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", { timeZone: "UTC" });
}

// Format a real timestamp in Ecuador time
export function formatDateEc(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", { timeZone: ECUADOR_TZ });
}

export function formatDateTimeEc(date: Date | string): string {
  return new Date(date).toLocaleString("es-ES", { timeZone: ECUADOR_TZ });
}
