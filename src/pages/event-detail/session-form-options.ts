import { SeatingArrangement } from '../../contract';

// SRS §4.2: "Engagement / Haldi / Wedding / Custom — dropdown + custom" —
// same free-text-with-presets phrasing as event_family_type (STORY-015),
// so this uses the identical preset-select + reveal-a-text-field pattern
// EventCreationForm already established, not a closed enum.
export const SESSION_TYPE_PRESETS = ['Engagement', 'Haldi', 'Wedding'];
// A distinct sentinel from any real preset, matching
// EventCreationForm's own CUSTOM_FAMILY_TYPE_OPTION reasoning — the
// submitted value is whatever the caller types, never this label itself.
export const CUSTOM_SESSION_TYPE_OPTION = 'Custom…';

// SRS §4.2: "Prefilled list (Poolside, Half Banquet, Full Banquet, Lawn,
// Conference, …) + custom" — same pattern again.
export const VENUE_PRESETS = ['Poolside', 'Half Banquet', 'Full Banquet', 'Lawn', 'Conference'];
export const CUSTOM_VENUE_OPTION = 'Custom…';

// Illustrative placeholder pricing — the SRS names the venue list but gives
// no actual cost figures; these stand in for whatever lookup table the
// business eventually supplies (same "placeholder until confirmed" spirit
// as aaradhya-api's config.gstRatePercent default). venue_cost stays
// editable after auto-fill either way (this story's own AC), so a wrong
// placeholder here is never a dead end.
export const VENUE_COST_LOOKUP: Record<string, number> = {
  Poolside: 40000,
  'Half Banquet': 60000,
  'Full Banquet': 100000,
  Lawn: 50000,
  Conference: 30000,
};

// Human labels for the closed SeatingArrangement enum — the enum's own
// values (RoundTables, UShape) aren't fit to display as-is.
export const SEATING_ARRANGEMENT_LABELS: Record<SeatingArrangement, string> = {
  [SeatingArrangement.Theatre]: 'Theatre',
  [SeatingArrangement.RoundTables]: 'Round Tables',
  [SeatingArrangement.Classroom]: 'Classroom',
  [SeatingArrangement.UShape]: 'U-Shape',
  [SeatingArrangement.Cluster]: 'Cluster',
  [SeatingArrangement.Other]: 'Other',
};
