// Pure, DOM-free date/grid math for the month calendar (STORY-035) — no
// fixed row count assumed (this story's own edge case: "grid must not
// assume a fixed row count"). Everything works in UTC exclusively so a
// viewer outside IST never sees a day shift, the same "never let the API
// layer apply the client's local timezone" rule the backend's own overlap
// query follows (Spec_Amendment_MultiDate_Sessions.md).
const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

// Sunday-first grid (no convention is documented for this app; Sunday-first
// matches the "Google-Calendar-style grid" the spec amendment itself uses
// as its own reference point for calendar overflow behavior).
const WEEK_LENGTH = 7;

export interface MonthShift {
  month: number;
  year: number;
}

// Wraps year on both directions — December → next January, January →
// previous December.
export const shiftMonth = ({ month, year }: MonthShift, delta: number): MonthShift => {
  const zeroBasedTotal = month - 1 + delta;
  const normalizedMonth = ((zeroBasedTotal % 12) + 12) % 12;
  const yearOffset = Math.floor(zeroBasedTotal / 12);
  return { month: normalizedMonth + 1, year: year + yearOffset };
};

export const formatMonthLabel = (month: number, year: number): string =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

// One 'YYYY-MM-DD' string per grid cell, grouped into weeks of 7 — as many
// weeks as the month actually needs (4, 5, or 6), padded with the
// surrounding month's own trailing/leading days so every week is a full 7
// days (this story's own Tokens line names a dedicated `text-faint` style
// for exactly these out-of-month days, so they're rendered, not omitted).
export const buildMonthGrid = (month: number, year: number): string[][] => {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));

  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const gridEnd = new Date(lastOfMonth);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

  const days: string[] = [];
  for (const cursor = new Date(gridStart); cursor.getTime() <= gridEnd.getTime();) {
    days.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += WEEK_LENGTH) {
    weeks.push(days.slice(i, i + WEEK_LENGTH));
  }
  return weeks;
};

// A grid cell's own date string always carries its calendar day (the last
// two digits of 'YYYY-MM-DD') regardless of which month it belongs to.
export const dayOfMonth = (date: string): number => Number(date.slice(8, 10));

// Whether a grid cell's date actually falls within the queried month —
// false for the leading/trailing days `buildMonthGrid` pads the grid with.
export const isInMonth = (date: string, month: number, year: number): boolean => {
  const [cellYear, cellMonth] = date.split('-').map(Number);
  return cellYear === year && cellMonth === month;
};
