import { ItemType } from '../../contract';
import type { MenuItemChip } from '../event-detail/menu-item-search';

// A distinct sentinel from any real preset — same "dropdown + custom"
// convention this app already uses everywhere else (event-details-step.tsx's
// own CUSTOM_EVENT_TYPE_OPTION). No master list backs either of these two
// lists (unlike Venue/EventType/RoomType, STORY-061) — the SRS names no
// fixed list for either, so these presets are the same "illustrative
// placeholder until confirmed" the app already accepted for
// session-form-options.ts's own VENUE_COST_LOOKUP, drawn from the SRS's own
// §4.7f worked examples ("Muhurta", "Engagement Sangeet").
export const CEREMONY_EVENT_NAME_PRESETS = ['Muhurta', 'Engagement Sangeet', 'Cake Cutting'];
export const CUSTOM_CEREMONY_EVENT_OPTION = 'Custom…';
export const MEAL_NAME_PRESETS = ['Breakfast', 'Lunch', 'Hi-Tea', 'Dinner'];
export const CUSTOM_MEAL_NAME_OPTION = 'Custom…';

// Field names match createItemBodySchema's own Event-variant one-for-one
// (contract/index.ts) — ready for STORY-068's eventual per-Session POST,
// same reasoning event-details-step.tsx's own WizardSessionRow documents.
// No `venue` field — this story's own AC explicitly limits the Ceremony
// Events form to Event Name + Start/End Time; venue is read-only, pulled
// from the date's own Session(s) (the reminder line above), never
// re-entered per Item. STORY-068 is expected to default an Event Item's
// `venue` from its parent Session at submission time.
export interface WizardCeremonyItem {
  id: string;
  type: ItemType.Event;
  eventName: string;
  startTime: string;
  endTime: string;
}

// Field names match createItemBodySchema's own Meal-variant one-for-one.
export interface WizardFoodItem {
  id: string;
  type: ItemType.Meal;
  mealName: string;
  startTime: string;
  endTime: string;
  pax: number;
  limitedSeating: boolean;
  costPerPlate: number;
  menuItems: MenuItemChip[];
}

export type WizardDateEntry = WizardCeremonyItem | WizardFoodItem;

export interface CeremonyFormValues {
  eventNameOption: string;
  eventNameCustom: string;
  startTime: string;
  endTime: string;
}

export const emptyCeremonyEntry: CeremonyFormValues = {
  eventNameOption: '',
  eventNameCustom: '',
  startTime: '',
  endTime: '',
};

export const toCeremonyFormValues = (item: WizardCeremonyItem): CeremonyFormValues => {
  const isPreset = CEREMONY_EVENT_NAME_PRESETS.includes(item.eventName);
  return {
    eventNameOption: isPreset ? item.eventName : item.eventName ? CUSTOM_CEREMONY_EVENT_OPTION : '',
    eventNameCustom: isPreset ? '' : item.eventName,
    startTime: item.startTime,
    endTime: item.endTime,
  };
};

export interface FoodFormValues {
  mealNameOption: string;
  mealNameCustom: string;
  startTime: string;
  endTime: string;
  pax: number;
  limitedSeating: boolean;
  costPerPlate: number;
  menuItems: MenuItemChip[];
}

export const emptyFoodEntry: FoodFormValues = {
  mealNameOption: '',
  mealNameCustom: '',
  startTime: '',
  endTime: '',
  pax: 0,
  limitedSeating: false,
  costPerPlate: 0,
  menuItems: [],
};

export const toFoodFormValues = (item: WizardFoodItem): FoodFormValues => {
  const isPreset = MEAL_NAME_PRESETS.includes(item.mealName);
  return {
    mealNameOption: isPreset ? item.mealName : item.mealName ? CUSTOM_MEAL_NAME_OPTION : '',
    mealNameCustom: isPreset ? '' : item.mealName,
    startTime: item.startTime,
    endTime: item.endTime,
    pax: item.pax,
    limitedSeating: item.limitedSeating,
    costPerPlate: item.costPerPlate,
    menuItems: item.menuItems,
  };
};
