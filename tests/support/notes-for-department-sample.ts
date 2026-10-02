import { SeatingArrangement } from '../../src/contract';

// notes_for_department.pdf (aaradhya-api/docs/example_quatations): Dr.
// Chubhe's birthday dinner, as GET /events/:id/banquet-event-order returns it.
export const DINNER_MENU = [
  'Veg Manchow Soup',
  'Mutton Chops',
  'Prawns Tikka',
  'Chicken Kebab',
  'Paneer Tikka',
  'Mutton Dum Biryani',
  'Veg Dum Biryani',
  'Tambda Rassa',
  'Pandhra Rassa',
  'Veg Raita',
  'Ice Cream',
];

const emptySetup = {
  seating: null,
  tableCount: 0,
  chairCount: 0,
  stage: false,
  buffet: false,
  registrationDesk: false,
  vipSeating: false,
  brideGroomSeating: false,
  notes: null,
};

export const SAMPLE_BEO_SESSION = {
  id: 'session-1',
  sessionType: 'Birthday Party/ Cocktail party',
  venue: 'Mini Party Hall',
  startDate: '2026-08-26T00:00:00.000Z',
  endDate: '2026-08-26T00:00:00.000Z',
  startTime: '20:00',
  endTime: '23:00',
  pax: 20,
  meals: [{ mealName: 'Dinner', startTime: '20:00', endTime: '23:00', menuItems: DINNER_MENU }],
  ceremonies: ['Cake cutting'],
  setup: { ...emptySetup, seating: SeatingArrangement.SquareTables },
  departmentNotes: {
    vegPax: 4,
    nonVegPax: 16,
    maintenance: ['Sound System'],
    restaurantNote: 'Billing will be as per a la carte.',
  },
};

// A second page in the Figma's ARD-EVT-2026-014 style: setup counts and
// toggles, two meals, no Restaurant note.
export const HALDI_BEO_SESSION = {
  id: 'session-2',
  sessionType: 'Haldi',
  venue: 'Poolside',
  startDate: '2026-12-13T00:00:00.000Z',
  endDate: '2026-12-13T00:00:00.000Z',
  startTime: '09:00',
  endTime: '12:00',
  pax: 120,
  meals: [
    { mealName: 'Breakfast', startTime: '09:00', endTime: '10:30', menuItems: ['Poha', 'Upma'] },
    { mealName: 'Lunch', startTime: '12:00', endTime: '14:00', menuItems: ['Paneer Butter Masala', 'Phulka'] },
  ],
  ceremonies: [],
  setup: {
    ...emptySetup,
    seating: SeatingArrangement.RoundTables,
    tableCount: 12,
    chairCount: 120,
    stage: true,
    buffet: true,
    notes: 'Marigold backdrop along the pool.',
  },
  departmentNotes: { vegPax: 100, nonVegPax: 20, maintenance: ['Sound System'], restaurantNote: null },
};

export const SAMPLE_BEO = {
  id: '650000000000000000000001',
  eventId: 'ARD-EVT-2026-031',
  clientName: 'Dr. Chubhe',
  sessions: [SAMPLE_BEO_SESSION],
};
