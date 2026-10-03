// example_quatation_3.pdf (aaradhya-api/docs/example_quatations) as the
// GET /events/:id response it would come from, with menu-item ids resolved
// through EXAMPLE_3_MENU_ITEMS. The figures the Quotation must reproduce:
// Food Cost 473600 · GST 23680 · ₹ 4,97,280; Accommodation 1,17,600 less
// 10% (11,760) = 1,05,840 · GST 5292 · ₹ 1,11,132; Grand Total
// Rs. 9,75,412 /-.
import { ClientContactRole, EventStatus, ItemType, SessionStatus } from '../../src/contract';

const MENU_NAMES = [
  'Tea',
  'Coffee',
  'Mini Batata Wada',
  'Mint Mojito',
  'Veg Manchow Soup',
  'Gobi Manchurian',
  'Harabhara Kebab',
  'Plain Rice',
  'Biryani Rice',
  'Dal Tadka',
  'Chole Masala',
  'Puri',
  'Fulke',
  'Salad',
  'Gulab jamun - Choice',
  'Vanilla Ice cream with Chocolate Syrup',
  'Pohe',
  'Upma',
  'Mutter Pulao',
  'Dal Fry',
  'Punjabi Veg',
  'Maharashtrian Veg',
  'Mix Pakoda',
  'Papad',
  'Pickle',
  'Basundi',
  'Vanilla Ice Cream',
  'Mix Biscuits',
];

const menuItemId = (name: string): string => `mi-${MENU_NAMES.indexOf(name)}`;

export const EXAMPLE_3_MENU_ITEMS = MENU_NAMES.map((name) => ({
  id: menuItemId(name),
  name,
  defaultCostPerPlate: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

const meal = (
  id: string,
  mealName: string,
  startTime: string | null,
  endTime: string | null,
  pax: number,
  costPerPlate: number,
  menu: string[]
) => ({
  id,
  type: ItemType.Meal,
  mealName,
  pax,
  costPerPlate,
  limitedSeating: false,
  menuItems: menu.map(menuItemId),
  eventName: null,
  venue: null,
  startTime,
  endTime,
  totalCost: pax * costPerPlate,
});

const ceremony = (id: string, eventName: string, startTime: string, endTime: string | null, venue: string) => ({
  id,
  type: ItemType.Event,
  mealName: null,
  pax: null,
  costPerPlate: null,
  limitedSeating: false,
  menuItems: [],
  eventName,
  venue,
  startTime,
  endTime,
  totalCost: null,
});

type ExampleItem = ReturnType<typeof meal> | ReturnType<typeof ceremony>;

const session = (
  id: string,
  sessionType: string,
  date: string,
  startTime: string,
  endTime: string,
  pax: number,
  venue: string,
  venueCost: number,
  items: ExampleItem[]
) => ({
  id,
  sessionType,
  venue,
  venueCost,
  startDate: `${date}T00:00:00.000Z`,
  endDate: `${date}T00:00:00.000Z`,
  startTime,
  endTime,
  pax,
  sessionStatus: SessionStatus.Active,
  durationDays: 1,
  isMultiDay: false,
  items,
});

export const EXAMPLE_3_EVENT = {
  id: 'evt-3',
  eventId: 'ARD-EVT-2026-014',
  eventFamilyType: 'Wedding',
  status: EventStatus.Tentative,
  eventManager: 'user-1',
  clientContacts: [
    { name: '', contactNumber: '', role: ClientContactRole.Bride },
    { name: '', contactNumber: '', role: ClientContactRole.Groom },
    { name: 'Mr. Prathamesh Parab', contactNumber: '9152130833 9321568300', role: ClientContactRole.POC },
  ],
  sessions: [
    session('s-haldi', 'Haldi', '2027-05-14', '17:00', '22:30', 40, 'Poolside', 60000, [
      meal('i-hitea', 'Hi Tea', '17:00', '18:30', 40, 150, ['Tea', 'Coffee', 'Mini Batata Wada']),
      ceremony('i-haldi', 'Haldi', '19:00', '21:30', 'Poolside'),
      meal('i-mocktails', 'Mocktails', '20:30', null, 40, 40, ['Mint Mojito']),
      meal('i-dinner', 'Dinner', '21:30', '23:00', 40, 650, [
        'Veg Manchow Soup',
        'Gobi Manchurian',
        'Harabhara Kebab',
        'Plain Rice',
        'Biryani Rice',
        'Dal Tadka',
        'Chole Masala',
        'Puri',
        'Fulke',
        'Salad',
        'Gulab jamun - Choice',
        'Vanilla Ice cream with Chocolate Syrup',
      ]),
    ]),
    session('s-wedding', 'Wedding', '2027-05-15', '09:00', '15:00', 1000, 'Full Banquet', 120000, [
      meal('i-breakfast', 'Breakfast', '08:00', '09:30', 150, 160, ['Tea', 'Coffee', 'Pohe', 'Upma']),
      meal('i-welcome', 'Welcome Drink', '10:30', '11:00', 1000, 20, []),
      ceremony('i-muhurta', 'Muhurta', '12:30', null, 'Full Banquet'),
      meal('i-lunch', 'Lunch', '12:30', '15:00', 1000, 380, [
        'Plain Rice',
        'Mutter Pulao',
        'Dal Fry',
        'Punjabi Veg',
        'Maharashtrian Veg',
        'Puri',
        'Fulke',
        'Mix Pakoda',
        'Papad',
        'Pickle',
        'Salad',
        'Basundi',
        'Vanilla Ice Cream',
      ]),
      meal('i-hitea-2', 'Hi-Tea', null, null, 200, 80, ['Tea', 'Coffee', 'Mix Biscuits']),
    ]),
  ],
  accommodation: {
    checkIn: '2027-05-13T00:00:00.000Z',
    checkOut: '2027-05-15T00:00:00.000Z',
    totalNights: 2,
    roomLines: [
      { roomType: 'Delux', occupancy: 2, tariff: 2800, noOfRooms: 14, totalTaxable: 78400 },
      { roomType: 'Executive', occupancy: 3, tariff: 3800, noOfRooms: 2, totalTaxable: 15200 },
      { roomType: 'Family Room', occupancy: 6, tariff: 6000, noOfRooms: 2, totalTaxable: 24000 },
      { roomType: 'Extra Beds', occupancy: 0, tariff: 700, noOfRooms: 0, totalTaxable: 0 },
    ],
    totalOccupancy: 46,
    totalCharges: 117600,
    discountPercent: 10,
    discountAmount: 11760,
    finalAmount: 105840,
  },
  extraLineItems: [
    { name: 'Decoration', note: 'Poolside + Banquet Hall (No Vidhi Mandap)', amount: 150000 },
    { name: 'DJ + Sound System', note: null, amount: 30000 },
    { name: 'Bhatji', note: 'wedding + punyawachan', amount: 7000 },
  ],
  foodGstRatePercent: 5,
  payment: { totalEstimatedAmount: 0, advanceRequired: 0, advancePaid: 0, balance: 0 },
  documentsChecklist: [],
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

// GET /events/:id/quotation-summary for the same Event (aaradhya-api
// computeTotalCostSummary; extras are the manual line items here).
export const EXAMPLE_3_QUOTATION_SUMMARY = {
  venueTotal: 180000,
  foodSubtotal: 473600,
  foodTotalInclGst: 497280,
  accommodationTaxable: 105840,
  accommodationGst: 5292,
  accommodationTotal: 111132,
  extrasTotal: 187000,
  grandTotal: 975412,
};
