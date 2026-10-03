import type { Dayjs } from 'dayjs';
import { toPickerDate } from '../../pages/event-detail/date-input';

export interface RangeEndDateProps {
  minDate?: Dayjs;
  referenceDate?: Dayjs;
}

// R8 / V5 (Figma Picker/Date Popover Mode=Range-limited): the End /
// Check-out picker can't pick a day before the start, and opens on the
// start's month. With no start set it's an ordinary picker (current month).
// Spread onto the end DatePicker of every start/end pair.
export const getRangeEndDateProps = (start: string): RangeEndDateProps => {
  const startDate = toPickerDate(start);
  if (!startDate?.isValid()) {
    return {};
  }
  return { minDate: startDate, referenceDate: startDate };
};

// 'YYYY-MM-DD' strings compare chronologically. Used to clear the end when
// the start moves past it (V5), and by each form's own backstop validation.
export const isEndBeforeStart = (start: string, end: string): boolean => Boolean(start && end && end < start);
