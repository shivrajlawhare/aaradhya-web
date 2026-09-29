import dayjs from 'dayjs';
import { toDateInputValue } from '../event-detail/date-input';

// The page header eyebrow: "Thursday, 24 September 2026".
export const formatEyebrowDate = (date: Date): string => dayjs(date).format('dddd, D MMMM YYYY');

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 17;

const getDayPeriod = (date: Date): string => {
  const hour = date.getHours();
  if (hour < MORNING_END_HOUR) {
    return 'morning';
  }
  if (hour < AFTERNOON_END_HOUR) {
    return 'afternoon';
  }
  return 'evening';
};

// "Good evening, Priya" — the first name from the signed-in user.
export const formatGreeting = (date: Date, name: string): string => {
  const firstName = name.trim().split(/\s+/)[0] ?? name;
  return `Good ${getDayPeriod(date)}, ${firstName}`;
};

export interface DateBlockParts {
  // The app's stored YYYY-MM-DD, still printed as-is under the block.
  isoDate: string;
  day: string;
  month: string;
  weekday: string;
}

// The date block (day + month) is a presentation of the same date the app
// already prints as YYYY-MM-DD.
export const getDateBlockParts = (isoString: string): DateBlockParts => {
  const isoDate = toDateInputValue(isoString);
  const date = dayjs(isoDate);
  return {
    isoDate,
    day: date.format('DD'),
    month: date.format('MMM'),
    weekday: date.format('ddd'),
  };
};
