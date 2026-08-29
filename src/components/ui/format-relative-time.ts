const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// "2 hours ago", "in 3 days", etc. — the largest unit that's at least 1,
// falling back to seconds. Intl.RelativeTimeFormat is built into every
// evergreen browser, so this needs no date library.
export const formatRelativeTime = (date: Date, now: Date = new Date()): string => {
  const elapsedSeconds = (date.getTime() - now.getTime()) / 1000;

  for (const { unit, seconds } of UNITS) {
    if (Math.abs(elapsedSeconds) >= seconds) {
      return formatter.format(Math.round(elapsedSeconds / seconds), unit);
    }
  }

  return formatter.format(Math.round(elapsedSeconds), 'second');
};
