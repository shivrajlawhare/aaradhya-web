import dayjs, { type Dayjs } from 'dayjs';

// This app's own stored date shape is exactly 'YYYY-MM-DD' — the API
// returns a full ISO timestamp (or null when nothing's been entered yet).
// Shared by rooms-tab.tsx (STORY-020) and payments-tab.tsx (STORY-023) —
// extracted here once a second real caller needed the exact same
// conversion.
export const toDateInputValue = (isoString: string | null): string => (isoString ? isoString.slice(0, 10) : '');

// DatePicker/StaticTimePicker (STORY-057) are controlled by a Dayjs value,
// not the 'YYYY-MM-DD'/'HH:mm' strings every form in this app already
// stores and submits — converting only at the picker's own value/onChange
// boundary keeps that string the one source of truth (what a mutation body
// sends, what toDateInputValue above already produces), so swapping the
// input component doesn't touch what a form actually holds or submits.
export const toPickerDate = (value: string): Dayjs | null => (value ? dayjs(value, 'YYYY-MM-DD') : null);
// Invalid (a cleared picker fires onChange(null), not a bad string) falls
// back to '' — this story's own edge case: a cleared date field must show a
// placeholder, never an invalid/NaN date reaching form state.
export const fromPickerDate = (value: Dayjs | null): string => (value?.isValid() ? value.format('YYYY-MM-DD') : '');

export const toPickerTime = (value: string): Dayjs | null => (value ? dayjs(value, 'HH:mm') : null);
export const fromPickerTime = (value: Dayjs | null): string => (value?.isValid() ? value.format('HH:mm') : '');
