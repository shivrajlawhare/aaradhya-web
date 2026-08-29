// Native <input type="date"> needs exactly 'YYYY-MM-DD' — the API returns a
// full ISO timestamp (or null when nothing's been entered yet). Shared by
// rooms-tab.tsx (STORY-020) and payments-tab.tsx (STORY-023) — extracted
// here once a second real caller needed the exact same conversion.
export const toDateInputValue = (isoString: string | null): string =>
  isoString ? isoString.slice(0, 10) : '';
