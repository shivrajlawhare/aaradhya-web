// example_quatation_4.pdf (CR-1 5B / UI-41): the seeded One Day Event
// template exactly as GET /settings/one-day-event-template returns it, plus
// the Venues and Room Types masters it is applied against. Grand Total with
// no rooms booked: 1,20,000 + 2,60,400 + 1,15,000 + 7,000 = 5,02,400.

const menuItem = (index: number, name: string) => ({ id: `mi-${index}`, name });

const LUNCH_MENU = [
  'Plain Rice',
  'Mutter Pulao',
  'Dal Fry',
  'Punjabi Veg',
  'Maharashtrian Veg',
  'Puri',
  'Fulke',
  'Solkadhi',
  'Mix Pakoda',
  'Papad',
  'Pickle',
  'Salad',
  'Gulab jamun',
  'Vanilla Ice Cream',
];

export const EXAMPLE_4_TEMPLATE = {
  eventFamilyType: 'Wedding',
  session: {
    sessionType: 'Wedding',
    venue: 'Full Banquet',
    venueCost: null,
    startTime: '09:00',
    endTime: '15:00',
    pax: 500,
    setup: null,
  },
  roomLines: [
    { roomType: 'Delux', noOfRooms: 14 },
    { roomType: 'Executive', noOfRooms: 2 },
    { roomType: 'Family Room', noOfRooms: 2 },
    { roomType: 'Extra Beds', noOfRooms: 0 },
  ],
  ceremonies: [{ eventName: 'Muhurta', startTime: '11:00', endTime: '12:30' }],
  meals: [
    {
      mealName: 'Breakfast',
      startTime: '08:00',
      endTime: '09:30',
      pax: 50,
      costPerPlate: 160,
      limitedSeating: false,
      menuItems: ['Tea', 'Coffee', 'Pohe', 'Upma'].map((name, index) => menuItem(index, name)),
    },
    {
      mealName: 'Welcome Drink',
      startTime: '10:30',
      endTime: '11:00',
      pax: 500,
      costPerPlate: 30,
      limitedSeating: false,
      menuItems: [menuItem(4, 'Kokam Sarbat')],
    },
    {
      mealName: 'Lunch',
      startTime: '12:30',
      endTime: '15:00',
      pax: 500,
      costPerPlate: 450,
      limitedSeating: false,
      menuItems: LUNCH_MENU.map((name, index) => menuItem(index + 5, name)),
    },
  ],
  lineItems: [
    { name: 'Decoration', note: null, amount: 115000 },
    { name: 'Photographer', note: null, amount: 0 },
    { name: 'Bhatji', note: 'wedding + punyawachan', amount: 7000 },
  ],
  gstPercent: 5,
  updatedAt: '2026-10-02T00:00:00.000Z',
};

const masterDates = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

export const EXAMPLE_4_VENUES = [
  { id: 'venue-1', name: 'Full Banquet', defaultVenueCost: 120000, active: true, ...masterDates },
  { id: 'venue-2', name: 'Poolside', defaultVenueCost: 60000, active: true, ...masterDates },
];

// The DEV-07 seed, as GET /room-types sorts it (by name).
export const EXAMPLE_4_ROOM_TYPES = [
  { id: 'rt-1', name: 'Delux', occupancy: 2, defaultTariff: 2800, active: true, ...masterDates },
  { id: 'rt-2', name: 'Executive', occupancy: 3, defaultTariff: 3800, active: true, ...masterDates },
  { id: 'rt-4', name: 'Extra Beds', occupancy: 0, defaultTariff: 700, active: true, ...masterDates },
  { id: 'rt-3', name: 'Family Room', occupancy: 6, defaultTariff: 6000, active: true, ...masterDates },
];
