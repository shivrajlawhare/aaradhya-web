import { describe, expect, it } from 'vitest';
import { ItemType } from '../../src/contract';
import { DEFAULT_CONTACT_ROWS } from '../../src/pages/event-creation/client-details-step';
import { buildOneDayEventWizardData, hasEnteredWizardData } from '../../src/pages/event-creation/one-day-event-prefill';
import { isWizardStepReady } from '../../src/pages/event-creation/wizard-step-readiness';
import { EXAMPLE_4_ROOM_TYPES, EXAMPLE_4_TEMPLATE, EXAMPLE_4_VENUES } from '../support/example-quotation-4';

const MASTERS = { venues: EXAMPLE_4_VENUES, roomTypes: EXAMPLE_4_ROOM_TYPES };

describe('buildOneDayEventWizardData (DEV-11, D1/D8)', () => {
  const data = buildOneDayEventWizardData(EXAMPLE_4_TEMPLATE, '2026-12-12', MASTERS);

  it('leaves step 1 with the three empty default contacts', () => {
    expect(data['client-details']).toEqual({ contacts: DEFAULT_CONTACT_ROWS });
  });

  it('adds one Session on the chosen date, its unset venue cost taken from the Venues master', () => {
    expect(data['event-details']?.sessions).toEqual([
      expect.objectContaining({
        sessionType: 'Wedding',
        venue: 'Full Banquet',
        venueCost: 120000,
        pax: 500,
        startDate: '2026-12-12',
        endDate: '2026-12-12',
        startTime: '09:00',
        endTime: '15:00',
      }),
    ]);
  });

  it('keeps a venue cost the template overrides', () => {
    const overridden = buildOneDayEventWizardData(
      { ...EXAMPLE_4_TEMPLATE, session: { ...EXAMPLE_4_TEMPLATE.session, venueCost: 95000 } },
      '2026-12-12',
      MASTERS
    );

    expect(overridden['event-details']?.sessions).toEqual([expect.objectContaining({ venueCost: 95000 })]);
  });

  it('prefills the rooms with master occupancy and tariffs, and leaves check-in/check-out empty (D8)', () => {
    const accommodation = data['accommodation'];

    expect(accommodation).toMatchObject({ checkInDate: '', checkOutDate: '', discountPercent: 0, datesOptional: true });
    expect(accommodation?.roomLines).toEqual([
      expect.objectContaining({ roomType: 'Delux', occupancy: 2, tariff: 2800, noOfRooms: 14, locked: false }),
      expect.objectContaining({ roomType: 'Executive', occupancy: 3, tariff: 3800, noOfRooms: 2 }),
      expect.objectContaining({ roomType: 'Extra Beds', occupancy: 0, tariff: 700, noOfRooms: 0, locked: true }),
      expect.objectContaining({ roomType: 'Family Room', occupancy: 6, tariff: 6000, noOfRooms: 2 }),
    ]);
  });

  it('puts the ceremonies and meals on the date in time order, the date already visited', () => {
    const sessionsItems = data['sessions-items'];
    const entries = (
      sessionsItems?.byDate as Record<string, { type: ItemType; mealName?: string; eventName?: string }[]>
    )['2026-12-12'];

    expect(entries?.map((entry) => entry.mealName ?? entry.eventName)).toEqual([
      'Breakfast',
      'Welcome Drink',
      'Muhurta',
      'Lunch',
    ]);
    expect(entries?.[2]?.type).toBe(ItemType.Event);
    expect(entries?.[3]).toMatchObject({ pax: 500, costPerPlate: 450, limitedSeating: false });
    expect(sessionsItems).toMatchObject({ visitedDates: ['2026-12-12'], allDatesVisited: true });
  });

  it('sets the event type, GST and line items on step 5', () => {
    expect(data['review']).toMatchObject({
      eventFamilyTypeOption: 'Wedding',
      eventFamilyTypeCustom: '',
      gstPercent: 5,
      isSubmitting: false,
      manualLineItems: [
        expect.objectContaining({ name: 'Decoration', note: '', amount: 115000 }),
        expect.objectContaining({ name: 'Photographer', note: '', amount: 0 }),
        expect.objectContaining({ name: 'Bhatji', note: 'wedding + punyawachan', amount: 7000 }),
      ],
    });
  });

  it('passes the readiness checks of steps 2–5', () => {
    expect(isWizardStepReady('event-details', data['event-details'])).toBe(true);
    expect(isWizardStepReady('accommodation', data['accommodation'])).toBe(true);
    expect(isWizardStepReady('sessions-items', data['sessions-items'])).toBe(true);
    expect(isWizardStepReady('review', data['review'])).toBe(true);
  });
});

describe('Accommodation readiness with optional dates (D8)', () => {
  const base = { checkInDate: '', checkOutDate: '', roomLines: [], discountPercent: 0 };

  it('still needs both dates for an ordinary event', () => {
    expect(isWizardStepReady('accommodation', base)).toBe(false);
  });

  it('accepts no dates for a One Day Event, but not just one of them', () => {
    expect(isWizardStepReady('accommodation', { ...base, datesOptional: true })).toBe(true);
    expect(isWizardStepReady('accommodation', { ...base, datesOptional: true, checkInDate: '2026-12-12' })).toBe(false);
  });
});

describe('hasEnteredWizardData', () => {
  it('is false for an untouched wizard (default contacts, default rooms)', () => {
    expect(hasEnteredWizardData({})).toBe(false);
    expect(
      hasEnteredWizardData({
        'client-details': { contacts: DEFAULT_CONTACT_ROWS },
        accommodation: { checkInDate: '', checkOutDate: '', roomLines: [{ roomType: 'Delux' }], discountPercent: 0 },
      })
    ).toBe(false);
  });

  it('is true once a contact, a Session, a date, an item or a line item is entered', () => {
    const named = DEFAULT_CONTACT_ROWS.map((row) => (row.id === 'poc' ? { ...row, name: 'Asha' } : row));

    expect(hasEnteredWizardData({ 'client-details': { contacts: named } })).toBe(true);
    expect(hasEnteredWizardData({ 'event-details': { sessions: [{ id: 's-1' }] } })).toBe(true);
    expect(hasEnteredWizardData({ accommodation: { checkInDate: '2026-12-11', roomLines: [] } })).toBe(true);
    expect(hasEnteredWizardData({ 'sessions-items': { byDate: { '2026-12-12': [{ id: 'i-1' }] } } })).toBe(true);
    expect(hasEnteredWizardData({ review: { manualLineItems: [{ id: 'l-1' }] } })).toBe(true);
  });
});
