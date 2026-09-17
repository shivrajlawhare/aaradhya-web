// The four master lists this screen manages (STORY-062's own AC): the
// three from STORY-061 plus the pre-existing Menu Item list. One config
// entry per section drives both the desktop table and mobile card list —
// `costLabel` is null for Event Type (no default-cost field at all), and
// `supportsStatus` is false only for Menu Items, whose backend model
// (aaradhya-api's MenuItem) has never had an `active` field or a PATCH
// route — that section is add/browse-only, not a smaller version of the
// other three's edit/deactivate affordances.
export type SectionId = 'venues' | 'eventTypes' | 'roomTypes' | 'menuItems';

export interface SectionConfig {
  id: SectionId;
  label: string;
  costLabel: string | null;
  supportsStatus: boolean;
}

export const SECTIONS: SectionConfig[] = [
  { id: 'venues', label: 'Venues', costLabel: 'Default Venue Cost', supportsStatus: true },
  { id: 'eventTypes', label: 'Event Types', costLabel: null, supportsStatus: true },
  { id: 'roomTypes', label: 'Room Types', costLabel: 'Default Tariff', supportsStatus: true },
  { id: 'menuItems', label: 'Menu Items', costLabel: 'Default Cost / Plate', supportsStatus: false },
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
