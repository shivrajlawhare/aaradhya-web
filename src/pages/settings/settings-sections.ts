// The four master lists this screen manages (STORY-062's own AC): the
// three from STORY-061 plus the pre-existing Menu Item list. One config
// entry per section drives both the desktop table and mobile card list —
// `costLabel` is null for Event Type (no default-cost field at all).
// `supportsStatus` (the Active/Inactive toggle) and `supportsEdit` (the
// name/cost edit action) are two genuinely independent capabilities, not
// one flag standing in for both — Menu Items has no `active` field on its
// backend model at all (so `supportsStatus: false`), but its name/cost
// ARE now editable via PATCH /menu-items/:id, so `supportsEdit: true`.
// Conflating the two originally meant Menu Item rows had no Edit action
// either, purely as a side effect of not having a Status column.
export type SectionId = 'venues' | 'eventTypes' | 'roomTypes' | 'menuItems';

export interface SectionConfig {
  id: SectionId;
  label: string;
  costLabel: string | null;
  supportsStatus: boolean;
  supportsEdit: boolean;
}

export const SECTIONS: SectionConfig[] = [
  { id: 'venues', label: 'Venues', costLabel: 'Default Venue Cost', supportsStatus: true, supportsEdit: true },
  { id: 'eventTypes', label: 'Event Types', costLabel: null, supportsStatus: true, supportsEdit: true },
  { id: 'roomTypes', label: 'Room Types', costLabel: 'Default Tariff', supportsStatus: true, supportsEdit: true },
  { id: 'menuItems', label: 'Menu Items', costLabel: 'Default Cost / Plate', supportsStatus: false, supportsEdit: true },
];

// A common row shape every section's table/card list renders from, so
// those components stay generic instead of one bespoke variant per section.
// `active` is meaningless (always true, never shown) for a section whose
// config has `supportsStatus: false`.
export interface MasterListRow {
  id: string;
  name: string;
  cost: number | null;
  active: boolean;
}
