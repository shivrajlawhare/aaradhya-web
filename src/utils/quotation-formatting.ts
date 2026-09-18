// Deliberately no dayjs here — dayjs's own `dayjs(value, format)` parsing
// (the 2-arg/3-arg-strict form date-input.ts's own toPickerDate/toPickerTime
// rely on) silently no-ops without the customParseFormat plugin, which this
// app has never registered (main.tsx only wires AdapterDayjs). Rather than
// add that plugin app-wide for these two small formatters, both are plain
// string/number parsing against the exact 'HH:mm'/'YYYY-MM-DD' shapes this
// app's own forms already produce.

// A single 'HH:mm' time as it'll print on the Quotation — lowercase am/pm,
// no space before them, no leading zero on the hour, minutes only shown
// when non-zero ('6pm', '9:30am'). Blank/malformed input (an optional time
// field left empty) returns ''.
export const formatTimeOfDay = (time: string): string => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    return '';
  }
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) {
    return '';
  }
  const period = hour24 < 12 ? 'am' : 'pm';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === 0 ? `${hour12}${period}` : `${hour12}:${String(minute).padStart(2, '0')}${period}`;
};

// "<start> to <end>" (e.g. "6pm to 10pm", "9am to 3pm") — this story's own
// AC: written once here, reused verbatim by the Quotation renderer
// (STORY-069) for the exact same Event Details "Duration" column, not
// reimplemented there. Either side may be blank (both Start/End Time are
// optional at Step 2) — a blank side is simply omitted rather than printing
// "to" with nothing on one end.
export const formatSessionDuration = (startTime: string, endTime: string): string => {
  const start = formatTimeOfDay(startTime);
  const end = formatTimeOfDay(endTime);
  if (start && end) {
    return `${start} to ${end}`;
  }
  return start || end;
};

// 'YYYY-MM-DD' -> 'DD/MM/YYYY' — not mandated for reuse the way
// formatSessionDuration is (this story's own AC only names the duration
// formatter), but built the same "one place, reused" way on the same
// reasoning: STORY-069's own Event Details table standardizes on this
// exact format, so matching it here now avoids the wizard's own added-rows
// table showing dates in a different shape than the Quotation it feeds.
export const formatEventDate = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return '';
  }
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

// Glossary's "Limited Seating (L.S.)" — the literal rule the Quotation
// renderer applies to a Meal Item's Pax cell (FR-QUO-8): 'L.S. (Npax)' when
// the flag is set, else the bare number. Written once here (STORY-067's own
// AC) so both the wizard's live "Shown on Quotation as:" preview and its
// already-added rows list read the exact same text a future Quotation
// renderer (STORY-069+) would also produce from the same inputs.
export const formatQuotationPax = (pax: number, limitedSeating: boolean): string =>
  limitedSeating ? `L.S. (${pax}pax)` : `${pax}`;
