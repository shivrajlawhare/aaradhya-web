import type { z } from 'zod';
import { EMPTY_DEPARTMENT_NOTES } from '../../components/ui/department-notes-fields';
import {
  ItemType,
  type oneDayEventTemplateResultSchema,
  type roomTypeResultSchema,
  type venueResultSchema,
} from '../../contract';
import type { WizardData, WizardStepData } from '../../stores/event-wizard-context';
import type { ManualLineItem } from '../../utils/total-cost-summary';
import { DEFAULT_CONTACT_ROWS } from './client-details-step';
import { emptySetup, type WizardSessionRow, type WizardSessionSetup } from './event-details-step';
import { toEventFamilyTypeOption } from './event-family-type-options';
import { buildRoomLines } from './room-line-defaults';
import type { WizardDateEntry } from './sessions-items-forms';

export type OneDayEventTemplate = z.infer<typeof oneDayEventTemplateResultSchema>;
type VenueMasterEntry = Pick<z.infer<typeof venueResultSchema>, 'name' | 'defaultVenueCost' | 'active'>;
type RoomTypeMasterEntry = Pick<
  z.infer<typeof roomTypeResultSchema>,
  'name' | 'occupancy' | 'defaultTariff' | 'active'
>;

export interface OneDayEventMasters {
  venues: VenueMasterEntry[];
  roomTypes: RoomTypeMasterEntry[];
}

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const arrayField = (stepData: WizardStepData | undefined, field: string): unknown[] => {
  const value = stepData?.[field];
  return Array.isArray(value) ? value : [];
};

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim() !== '';

const isEnteredContact = (row: unknown): boolean => {
  if (typeof row !== 'object' || row === null) {
    return false;
  }
  const contact: Record<string, unknown> = { ...row };
  return contact.isDefault === false || hasText(contact.name) || hasText(contact.contactNumber);
};

/**
 * Whether the wizard holds anything the Event Manager entered — what decides
 * the One Day Event dialog's replace warning (UI-41). Step 1's three empty
 * default contacts and step 3's default rooms are written on first visit,
 * so they don't count on their own.
 */
export const hasEnteredWizardData = (data: WizardData): boolean => {
  const byDate = data['sessions-items']?.byDate;
  const hasItems =
    typeof byDate === 'object' &&
    byDate !== null &&
    Object.values(byDate).some((entries) => Array.isArray(entries) && entries.length > 0);
  const accommodation = data['accommodation'];
  const discountPercent = accommodation?.discountPercent;

  return (
    arrayField(data['client-details'], 'contacts').some(isEnteredContact) ||
    arrayField(data['event-details'], 'sessions').length > 0 ||
    hasText(accommodation?.checkInDate) ||
    hasText(accommodation?.checkOutDate) ||
    (typeof discountPercent === 'number' && discountPercent !== 0) ||
    hasItems ||
    arrayField(data['review'], 'manualLineItems').length > 0
  );
};

const toWizardSetup = (setup: OneDayEventTemplate['session']['setup']): WizardSessionSetup => ({
  seating: setup?.seating ?? emptySetup.seating,
  tableCount: setup?.tableCount ?? emptySetup.tableCount,
  chairCount: setup?.chairCount ?? emptySetup.chairCount,
  stage: setup?.stage ?? emptySetup.stage,
  buffet: setup?.buffet ?? emptySetup.buffet,
  registrationDesk: setup?.registrationDesk ?? emptySetup.registrationDesk,
  vipSeating: setup?.vipSeating ?? emptySetup.vipSeating,
  brideGroomSeating: setup?.brideGroomSeating ?? emptySetup.brideGroomSeating,
  notes: setup?.notes ?? emptySetup.notes,
});

// Ceremonies and meals in one list, in time order, as step 4 shows a date's
// rows — Breakfast, Welcome Drink, Muhurta, Lunch for example 4.
const toDateEntries = (template: OneDayEventTemplate): WizardDateEntry[] => {
  const ceremonies: WizardDateEntry[] = template.ceremonies.map((ceremony) => ({
    id: createId('item'),
    type: ItemType.Event,
    eventName: ceremony.eventName,
    startTime: ceremony.startTime,
    endTime: ceremony.endTime,
  }));
  const meals: WizardDateEntry[] = template.meals.map((meal) => ({
    id: createId('item'),
    type: ItemType.Meal,
    mealName: meal.mealName,
    startTime: meal.startTime,
    endTime: meal.endTime,
    pax: meal.pax,
    limitedSeating: meal.limitedSeating,
    costPerPlate: meal.costPerPlate,
    menuItems: meal.menuItems,
  }));
  return [...ceremonies, ...meals].sort((a, b) => a.startTime.localeCompare(b.startTime));
};

/**
 * The whole wizard as the One Day Event template prefills it on `eventDate`
 * ('YYYY-MM-DD') — CR-1 D1 / D8, UI-41:
 * 1. Client Details: the three empty default contacts (the user enters the POC).
 * 2. Event Details: one Session on the date; an unset venue cost comes from
 *    the Venues master.
 * 3. Accommodation: the template's room counts with master occupancy and
 *    tariffs, check-in/check-out empty (charges ₹ 0 until set).
 * 4. Sessions & Items: the date's ceremonies and meals, the date visited.
 * 5. Review: the event type, GST % and line items.
 * Steps 2–5 pass their readiness checks, so Next works straight through.
 */
export const buildOneDayEventWizardData = (
  template: OneDayEventTemplate,
  eventDate: string,
  masters: OneDayEventMasters
): WizardData => {
  const { session } = template;
  const masterVenue = masters.venues.find((venue) => venue.active && venue.name === session.venue);
  const sessionRow: WizardSessionRow = {
    id: createId('session'),
    sessionType: session.sessionType,
    venue: session.venue,
    venueCost: session.venueCost ?? masterVenue?.defaultVenueCost ?? 0,
    pax: session.pax,
    startDate: eventDate,
    endDate: eventDate,
    startTime: session.startTime,
    endTime: session.endTime,
    setup: toWizardSetup(session.setup),
    departmentNotes: EMPTY_DEPARTMENT_NOTES,
  };

  const roomCounts = Object.fromEntries(template.roomLines.map((line) => [line.roomType, line.noOfRooms]));
  const activeRoomTypes = masters.roomTypes.filter((roomType) => roomType.active);

  const eventFamilyType = toEventFamilyTypeOption(template.eventFamilyType);
  const manualLineItems: ManualLineItem[] = template.lineItems.map((lineItem) => ({
    id: createId('line-item'),
    name: lineItem.name,
    note: lineItem.note ?? '',
    amount: lineItem.amount,
  }));

  return {
    'client-details': { contacts: DEFAULT_CONTACT_ROWS },
    'event-details': { sessions: [sessionRow] },
    accommodation: {
      checkInDate: '',
      checkInTime: '',
      checkOutDate: '',
      checkOutTime: '',
      roomLines: buildRoomLines(activeRoomTypes, roomCounts),
      discountPercent: 0,
      datesOptional: true,
    },
    'sessions-items': {
      byDate: { [eventDate]: toDateEntries(template) },
      visitedDates: [eventDate],
      allDatesVisited: true,
    },
    review: {
      eventFamilyTypeOption: eventFamilyType.option,
      eventFamilyTypeCustom: eventFamilyType.custom,
      gstPercent: template.gstPercent,
      manualLineItems,
      isSubmitting: false,
    },
  };
};
