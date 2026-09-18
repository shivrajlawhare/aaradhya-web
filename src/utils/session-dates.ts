const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Every calendar date a Session spans, inclusive — a 3-day Session
// contributes 3 dates, not just its start/end. Plain Date iteration on
// already 'YYYY-MM-DD'-shaped strings, same "no dayjs format-string parsing
// needed" reasoning accommodation-calculations.ts's own computeTotalDays
// documents. Shared by event-details-step.tsx (STORY-065, deciding which
// dates a removed Session would orphan) and sessions-items-step.tsx
// (STORY-067, this step's own date tabs) — extracted here once a second
// real caller needed the exact same enumeration (directory-structure.md:
// "only extract to utils/ once a pattern genuinely repeats").
export const enumerateDates = (startDate: string, endDate: string): string[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }
  const dates: string[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
};

export const getDistinctDates = (rows: { startDate: string; endDate: string }[]): string[] => {
  const dates = new Set<string>();
  for (const row of rows) {
    for (const date of enumerateDates(row.startDate, row.endDate)) {
      dates.add(date);
    }
  }
  return Array.from(dates).sort();
};
