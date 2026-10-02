import type { z } from 'zod';
import type {
  oneDayEventTemplateResultSchema,
  roomTypeResultSchema,
  updateOneDayEventTemplateBodySchema,
  venueResultSchema,
} from '../../contract';
import type { MenuItemChip } from '../event-detail/menu-item-search';

type OneDayEventTemplate = z.infer<typeof oneDayEventTemplateResultSchema>;
type OneDayEventTemplateBody = z.infer<typeof updateOneDayEventTemplateBodySchema>;
type VenueMasterEntry = Pick<z.infer<typeof venueResultSchema>, 'name' | 'defaultVenueCost' | 'active'>;
type RoomTypeMasterEntry = Pick<
  z.infer<typeof roomTypeResultSchema>,
  'name' | 'occupancy' | 'defaultTariff' | 'active'
>;

// A Rooms table row: occupancy and tariff are shown read-only from the
// Room Types master; only the number of rooms is part of the template.
export interface TemplateRoomRow {
  roomType: string;
  occupancy: number;
  tariff: number;
  noOfRooms: number;
}

export interface TemplateCeremonyRow {
  eventName: string;
  startTime: string;
  endTime: string;
}

export interface TemplateMealRow {
  mealName: string;
  startTime: string;
  endTime: string;
  pax: number;
  costPerPlate: number;
  limitedSeating: boolean;
  menuItems: MenuItemChip[];
}

export interface TemplateLineItemRow {
  name: string;
  note: string;
  amount: number;
}

// Settings → One Day Event's form (UI-41): the Event card's fields, then
// one array per card.
export interface OneDayEventFormValues {
  eventFamilyType: string;
  sessionType: string;
  pax: number;
  venue: string;
  venueCost: number;
  startTime: string;
  endTime: string;
  roomLines: TemplateRoomRow[];
  ceremonies: TemplateCeremonyRow[];
  meals: TemplateMealRow[];
  lineItems: TemplateLineItemRow[];
  gstPercent: number;
}

export const EMPTY_CEREMONY: TemplateCeremonyRow = { eventName: '', startTime: '', endTime: '' };

export const EMPTY_MEAL: TemplateMealRow = {
  mealName: '',
  startTime: '',
  endTime: '',
  pax: 0,
  costPerPlate: 0,
  limitedSeating: false,
  menuItems: [],
};

export const EMPTY_LINE_ITEM: TemplateLineItemRow = { name: '', note: '', amount: 0 };

const masterVenueCost = (venues: VenueMasterEntry[], venueName: string): number | undefined =>
  venues.find((venue) => venue.active && venue.name === venueName)?.defaultVenueCost;

// The stored template as form values. An unset venue cost shows the Venues
// master's default; the Rooms table lists every active Room Type with the
// template's count (0 when the template has none).
export const toOneDayEventFormValues = (
  template: OneDayEventTemplate,
  venues: VenueMasterEntry[],
  roomTypes: RoomTypeMasterEntry[]
): OneDayEventFormValues => {
  const roomCounts = new Map(template.roomLines.map((line) => [line.roomType, line.noOfRooms]));
  return {
    eventFamilyType: template.eventFamilyType,
    sessionType: template.session.sessionType,
    pax: template.session.pax,
    venue: template.session.venue,
    venueCost: template.session.venueCost ?? masterVenueCost(venues, template.session.venue) ?? 0,
    startTime: template.session.startTime,
    endTime: template.session.endTime,
    roomLines: roomTypes
      .filter((roomType) => roomType.active)
      .map((roomType) => ({
        roomType: roomType.name,
        occupancy: roomType.occupancy,
        tariff: roomType.defaultTariff,
        noOfRooms: roomCounts.get(roomType.name) ?? 0,
      })),
    ceremonies: template.ceremonies.map((ceremony) => ({ ...ceremony })),
    meals: template.meals.map((meal) => ({ ...meal, menuItems: [...meal.menuItems] })),
    lineItems: template.lineItems.map((lineItem) => ({ ...lineItem, note: lineItem.note ?? '' })),
    gstPercent: template.gstPercent,
  };
};

const toWholeNumber = (value: number): number => (Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0);
const toAmount = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

/**
 * The form back into the PUT body. Every menu chip must already carry a real
 * Menu Item id. A venue cost equal to the Venues master's default is saved
 * as unset, so a later master edit still reaches the prefill (D1); any
 * other value is the template's own override. The Session's Setup isn't
 * edited here and is passed through unchanged.
 */
export const toOneDayEventTemplateBody = (
  values: OneDayEventFormValues,
  venues: VenueMasterEntry[],
  setup: OneDayEventTemplate['session']['setup']
): OneDayEventTemplateBody => {
  const venueCost = toAmount(values.venueCost);
  const isMasterCost = masterVenueCost(venues, values.venue) === venueCost;
  return {
    eventFamilyType: values.eventFamilyType.trim(),
    session: {
      sessionType: values.sessionType.trim(),
      venue: values.venue.trim(),
      venueCost: isMasterCost ? undefined : venueCost,
      startTime: values.startTime,
      endTime: values.endTime,
      pax: toWholeNumber(values.pax),
      setup: setup ?? undefined,
    },
    roomLines: values.roomLines.map((line) => ({ roomType: line.roomType, noOfRooms: toWholeNumber(line.noOfRooms) })),
    ceremonies: values.ceremonies.map((ceremony) => ({ ...ceremony, eventName: ceremony.eventName.trim() })),
    meals: values.meals.map((meal) => ({
      mealName: meal.mealName.trim(),
      startTime: meal.startTime,
      endTime: meal.endTime,
      pax: toWholeNumber(meal.pax),
      costPerPlate: toAmount(meal.costPerPlate),
      limitedSeating: meal.limitedSeating,
      menuItems: meal.menuItems.map((chip) => chip.id),
    })),
    lineItems: values.lineItems.map((lineItem) => ({
      name: lineItem.name.trim(),
      note: lineItem.note.trim() || undefined,
      amount: toAmount(lineItem.amount),
    })),
    gstPercent: Number.isFinite(values.gstPercent) ? Math.min(100, Math.max(0, values.gstPercent)) : 0,
  };
};
