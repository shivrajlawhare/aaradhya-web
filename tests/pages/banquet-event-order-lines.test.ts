import { describe, expect, it } from 'vitest';
import { SeatingArrangement } from '../../src/contract';
import { buildBeoPage, buildHousekeepingLines } from '../../src/pages/notes-for-department/banquet-event-order-lines';
import { DINNER_MENU, HALDI_BEO_SESSION, SAMPLE_BEO_SESSION } from '../support/notes-for-department-sample';

describe('buildBeoPage (DEV-12, 5B.3)', () => {
  it('reproduces notes_for_department.pdf for the Dr. Chubhe sample', () => {
    const page = buildBeoPage('Dr. Chubhe', SAMPLE_BEO_SESSION);

    expect(page.details).toEqual([
      { label: 'Client name', value: 'Dr. Chubhe' },
      { label: 'Date', value: '26 Aug 2026' },
      { label: 'Time', value: '8pm to 11pm' },
      { label: 'Number of Pax', value: '20' },
      { label: 'Venue', value: 'Mini Party Hall' },
      { label: 'Function Type', value: 'Birthday Party/ Cocktail party' },
    ]);
    expect(page.kitchen).toEqual({
      paxLines: ['Veg – 4 pax', 'Non-Veg – 16 pax'],
      menus: [{ heading: 'Dinner (8pm to 11pm)', items: DINNER_MENU }],
    });
    expect(page.departments).toEqual([
      { title: 'House Keeping', lines: ['Square Table Setup', 'Cake cutting Setup'] },
      { title: 'Maintainance', lines: ['Sound System'] },
      { title: 'Restaurant', lines: ['Billing will be as per a la carte.'] },
    ]);
  });

  it('omits empty department boxes and the kitchen when there is nothing for it', () => {
    const page = buildBeoPage('Asha', {
      ...SAMPLE_BEO_SESSION,
      meals: [],
      ceremonies: [],
      setup: { ...SAMPLE_BEO_SESSION.setup, seating: null },
      departmentNotes: { vegPax: null, nonVegPax: null, maintenance: [], restaurantNote: null },
    });

    expect(page.kitchen).toBeNull();
    expect(page.departments).toEqual([]);
  });

  it('prints only the Veg / Non-Veg lines that have a value', () => {
    const page = buildBeoPage('Asha', {
      ...SAMPLE_BEO_SESSION,
      departmentNotes: { ...SAMPLE_BEO_SESSION.departmentNotes, vegPax: null },
    });

    expect(page.kitchen?.paxLines).toEqual(['Non-Veg – 16 pax']);
  });

  it('spans a multi-day session’s dates and shows "—" with no times', () => {
    const page = buildBeoPage('Asha', {
      ...SAMPLE_BEO_SESSION,
      endDate: '2026-08-28T00:00:00.000Z',
      startTime: null,
      endTime: null,
    });

    expect(page.details[1]).toEqual({ label: 'Date', value: '26 – 28 Aug 2026' });
    expect(page.details[2]).toEqual({ label: 'Time', value: '—' });
  });
});

describe('buildHousekeepingLines', () => {
  it('lists seating, tables/chairs, enabled toggles, ceremonies, then the notes', () => {
    expect(buildHousekeepingLines({ ...HALDI_BEO_SESSION, ceremonies: ['Muhurta'] })).toEqual([
      'Round Table Setup',
      '12 Tables / 120 Chairs',
      'Stage',
      'Buffet',
      'Muhurta Setup',
      'Marigold backdrop along the pool.',
    ]);
  });

  it('skips an "Other" seating (its details live in the notes)', () => {
    expect(
      buildHousekeepingLines({
        ...SAMPLE_BEO_SESSION,
        setup: { ...SAMPLE_BEO_SESSION.setup, seating: SeatingArrangement.Other },
        ceremonies: [],
      })
    ).toEqual([]);
  });
});
