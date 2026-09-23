// STORY-075 — the acceptance test proving STORY-069 through STORY-073
// actually reproduce docs/example_quatations/example_quatation_1.pdf and
// example_quatation_2.pdf (aaradhya-api repo), not merely believed to.
// Every fixture below is transcribed field-for-field from its own source
// PDF; every assertion checks a real, transcribed value from that same
// PDF — this file intentionally does NOT reuse the smaller, synthetic
// fixtures scattered across quotation-document.test.tsx's own per-feature
// unit tests, since the whole point here is one full, internally-consistent
// Event rendered once and checked table by table end to end.
//
// Two known, already-documented divergences from the reference PDFs' own
// hand-typed Total Cost Summary tables are deliberately NOT reproduced
// here (see the inline comments at each assertion):
//   1. example_quatation_2.pdf's own Total Cost Summary prints "Poolside"
//      for the Engagement venue row and "Banquet Hall" for the Wedding one,
//      even though both reference PDFs' own Event Details summary tables
//      store those same Sessions' venue as "Poolside/Half Banquet" and
//      "Full Banquet" respectively — an unexplained, inconsistent manual
//      shorthand with no derivable rule (STORY-072's own Decisions already
//      flagged this). This renderer prints session.venue verbatim in both
//      tables, consistently — the correct, intentional behavior to test.
//   2. example_quatation_2.pdf's own Wedding-date Total Cost Summary block
//      lists "Breakfast, Lunch, welcome drink" — Lunch before Welcome
//      Drink — while its own Event Details table enters them in the order
//      Breakfast, Welcome Drink, Muhurta, Lunch. This renderer preserves
//      real entry order (Breakfast, Welcome Drink, Lunch), the same
//      "don't invent an unrequested reorder" call STORY-072 already
//      documents for example_quatation_1.pdf's own Cake/Dinner swap.
import { ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientContactRole, ItemType, SessionStatus } from '../../src/contract';
import QuotationDocument, {
  type QuotationDocumentAccommodation,
  type QuotationDocumentClientContact,
  type QuotationDocumentManualLineItem,
  type QuotationDocumentSession,
} from '../../src/pages/quotation-preview/quotation-document';
import { theme } from '../../src/theme/theme';

const renderFixture = (options: {
  clientContacts: QuotationDocumentClientContact[];
  sessions: QuotationDocumentSession[];
  accommodation: QuotationDocumentAccommodation;
  extraLineItems: QuotationDocumentManualLineItem[];
}) =>
  render(
    <ThemeProvider theme={theme}>
      <QuotationDocument
        clientContacts={options.clientContacts}
        sessions={options.sessions}
        accommodation={options.accommodation}
        extraLineItems={options.extraLineItems}
        // Pinned explicitly to 5 — both reference PDFs' own printed Food
        // Cost with GST figures only reproduce at 5% (this story's own
        // edge case: must not silently break if the org-wide default ever
        // changes).
        foodGstRatePercent={5}
        quotationDate={new Date(2026, 7, 23)}
      />
    </ThemeProvider>
  );

describe('Quotation fidelity — example_quatation_1.pdf (Sneha & Nishant)', () => {
  const clientContacts: QuotationDocumentClientContact[] = [
    { name: 'Sneha Bhaskar Vaidya', contactNumber: '9850053586', role: ClientContactRole.Bride },
    { name: 'Nishant', contactNumber: '', role: ClientContactRole.Groom },
    { name: 'Mr. Bhaskar Vaidya', contactNumber: '9422055215', role: ClientContactRole.POC },
  ];

  const sessions: QuotationDocumentSession[] = [
    {
      id: 'engagement',
      sessionType: 'Engagement',
      venue: 'Poolside',
      venueCost: 60000,
      startDate: '2026-12-10',
      startTime: '18:00',
      endTime: '22:00',
      pax: 30,
      sessionStatus: SessionStatus.Active,
      items: [
        {
          id: 'hi-tea',
          type: ItemType.Meal,
          mealName: 'Hi Tea snacks - poolside',
          pax: 30,
          costPerPlate: 275,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '18:00',
          endTime: '19:00',
          menuItemNames: ['Tea', 'Coffee', 'Cold Drinks - black', 'Onion Pakoda', 'Veg Sandwich', 'Biscuits'],
        },
        {
          id: 'engagement-sangeet',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: 'Engagement Sangeet',
          venue: 'Poolside',
          startTime: null,
          endTime: null,
          menuItemNames: [],
        },
        {
          id: 'chaat-counter-1',
          type: ItemType.Meal,
          mealName: 'Chaat Counter',
          pax: 30,
          costPerPlate: 12000,
          limitedSeating: true,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: ['Aloo Tikki Chat', 'Pani puri/ sevpuri'],
        },
        {
          id: 'chai-tapri',
          type: ItemType.Meal,
          mealName: 'Chai Tapri',
          pax: 30,
          costPerPlate: 5000,
          limitedSeating: true,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: ['Maggie', 'Tea'],
        },
        {
          id: 'drinks',
          type: ItemType.Meal,
          mealName: 'Drinks',
          pax: 30,
          costPerPlate: 80,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: ['Mint Mojito'],
        },
        {
          id: 'dinner-poolside',
          type: ItemType.Meal,
          mealName: 'Dinner - poolside',
          pax: 30,
          costPerPlate: 900,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: [
            'Veg Manchow Soup',
            'Veg Manchurian',
            'Paneer Tikka',
            'Jeera Rice',
            'Dal Fry',
            'Veg Kolhapuri',
            'Paneer Bhurji',
            'Tandoori Roti',
            'Fulke',
            'Butter on the side',
            'Peanut Salad',
            'Veg Raita',
            'Green Salad',
            'Rabdi Jalebi',
            'Gulabjamun',
            'Kulfi',
          ],
        },
        {
          id: 'engagement-cake',
          type: ItemType.Meal,
          mealName: 'Engagement Cake',
          pax: 30,
          costPerPlate: 3000,
          limitedSeating: true,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: [],
        },
      ],
    },
    {
      id: 'wedding',
      sessionType: 'Wedding',
      venue: 'Full Banquet',
      venueCost: 120000,
      startDate: '2026-12-11',
      startTime: '09:00',
      endTime: '15:00',
      pax: 300,
      sessionStatus: SessionStatus.Active,
      items: [
        {
          id: 'breakfast',
          type: ItemType.Meal,
          mealName: 'Breakfast',
          pax: 50,
          costPerPlate: 350,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '08:00',
          endTime: '09:30',
          menuItemNames: [
            'Tea',
            'Coffee',
            'Hot Milk',
            'Aloo paratha with Butter',
            'Curd',
            'Poha',
            'Idli',
            'Coconut Chutney (Green Spicy)',
            'Cornflakes/Chocos',
            'Mix Fruit Juice',
            'Cut Fruits',
          ],
        },
        {
          id: 'starter',
          type: ItemType.Meal,
          mealName: 'Starter',
          pax: 300,
          costPerPlate: 180,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: ['Spring Roll', 'Cheese potato bites'],
        },
        {
          id: 'chaat-counter-2',
          type: ItemType.Meal,
          mealName: 'Chaat Counter',
          pax: 300,
          costPerPlate: 45000,
          limitedSeating: true,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: ['Pani puri', 'Sev puri'],
        },
        {
          id: 'welcome-drink',
          type: ItemType.Meal,
          mealName: 'Welcome Drink - moving',
          pax: 300,
          costPerPlate: 210,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '10:30',
          endTime: '11:00',
          menuItemNames: ['Thandai', 'Juice', 'Cold drinks'],
        },
        {
          id: 'muhurta',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: 'Muhurta',
          venue: null,
          startTime: '11:00',
          endTime: '12:30',
          menuItemNames: [],
        },
        {
          id: 'lunch',
          type: ItemType.Meal,
          mealName: 'Lunch',
          pax: 300,
          costPerPlate: 1200,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '12:30',
          endTime: '15:00',
          menuItemNames: [
            'Spring Roll',
            'Cheese Potato Bites',
            'Steam Rice',
            'Veg Biryani',
            'Mix Veg kurma',
            'Paneer Lababdar',
            'Bhendi do Pyaza',
            'Dry Yellow Potato',
            'Live Dal Fry',
            'Akkha Masoor',
            'Tandoor Roti',
            'Fulke',
            'Butter on the side',
            'Puri',
            'Papad',
            'French fries',
            'Pakoda',
            'Chaas',
            'Solkadhi',
            'Veg Raita',
            'Green Salad',
            'Corn Salad',
            'Rasmalai',
            'Gajar Halwa',
            'Amrakhand',
            'Ice – Cream with Choco syrup',
          ],
        },
      ],
    },
  ];

  const accommodation: QuotationDocumentAccommodation = {
    checkIn: '2026-12-10',
    checkOut: '2026-12-12',
    totalDays: 2,
    roomLines: [
      { roomType: 'Delux', occupancy: 2, tariff: 2500, noOfRooms: 14, totalInclGst: 73500 },
      { roomType: 'Executive', occupancy: 3, tariff: 3500, noOfRooms: 2, totalInclGst: 14700 },
      { roomType: 'Dormatory', occupancy: 6, tariff: 5000, noOfRooms: 2, totalInclGst: 21000 },
      { roomType: 'Extra Beds', occupancy: 0, tariff: 700, noOfRooms: 0, totalInclGst: 0 },
    ],
    totalOccupancy: 46,
    totalCharges: 109200,
  };

  const extraLineItems: QuotationDocumentManualLineItem[] = [
    { name: 'Decoration', note: 'poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)', amount: 150000 },
    { name: 'Photographer', note: null, amount: 0 },
    { name: 'Bhatji', note: 'wedding', amount: 7000 },
  ];

  it("renders the Client Details table exactly (3 rows, including Nishant's blank Contact Number)", () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Client Details' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
      )
    ).toEqual([
      ['Bride', 'Sneha Bhaskar Vaidya', '9850053586'],
      ['Groom', 'Nishant', ''],
      ['Point of Contact', 'Mr. Bhaskar Vaidya', '9422055215'],
    ]);
  });

  it('renders the Event Details summary table exactly (2 rows)', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
      )
    ).toEqual([
      ['Engagement', '10/12/2026', '6pm to 10pm', '30', 'Poolside', '60,000/-'],
      ['Wedding', '11/12/2026', '9am to 3pm', '300', 'Full Banquet', '1,20,000/-'],
    ]);
  });

  it('renders Accommodation Details exactly: merged Check-in/Check-out/Total Days, all 4 Room Lines, green/amber footer', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    const allRows = within(table).getAllByRole('row');
    expect(allRows).toHaveLength(6);
    const rows = allRows.slice(1);

    const firstRoomLineCells = within(rows[0]!).getAllByRole('cell');
    expect(firstRoomLineCells[0]!.textContent).toBe('10-12-202612pm');
    expect(firstRoomLineCells[0]!).toHaveAttribute('rowspan', '4');
    expect(firstRoomLineCells[1]!.textContent).toBe('12-12-202611am');
    expect(firstRoomLineCells[2]!.textContent).toBe('2');

    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
          .slice(-5)
      )
    ).toEqual([
      ['Delux', '2', '2500', '14', '73500'],
      ['Executive', '3', '3500', '2', '14700'],
      ['Dormatory', '6', '5000', '2', '21000'],
      ['Extra Beds', '0', '700', '0', '0'],
      ['Total Occ.', '46', '', 'Total Charges', 'Rs. 1,09,200 /-'],
    ]);
    const totalOccCell = within(rows[4]!).getAllByRole('cell')[4]!;
    expect(totalOccCell).toHaveStyle({ backgroundColor: 'rgb(169, 209, 142)' });
    const totalChargesCell = within(rows[4]!).getAllByRole('cell')[7]!;
    expect(totalChargesCell).toHaveStyle({ backgroundColor: 'rgb(255, 217, 102)' });
  });

  it('renders the 10/12/2026 Event Details table exactly, Ceremony row merged and shaded', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details – 10/12/2026' });
    const rows = within(table).getAllByRole('row');
    // Header + Hi Tea, Engagement Sangeet, Chaat Counter, Chai Tapri,
    // Drinks, Dinner - poolside, Engagement Cake = 8.
    expect(rows).toHaveLength(8);

    expect(
      within(rows[1]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual([
      'Hi Tea snacks - poolside',
      '6pm to 7pm',
      '30',
      '275/-',
      '1. Tea2. Coffee3. Cold Drinks - black4. Onion Pakoda5. Veg Sandwich6. Biscuits',
    ]);

    const ceremonyCell = within(rows[2]!).getAllByRole('cell')[0]!;
    expect(ceremonyCell).toHaveAttribute('colspan', '5');
    expect(ceremonyCell.textContent).toBe('Engagement Sangeet - Poolside');
    expect(ceremonyCell).toHaveStyle({ backgroundColor: 'rgb(217, 217, 217)' });

    expect(
      within(rows[3]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Chaat Counter', '', 'L.S. (30pax)', '12000/-', '1. Aloo Tikki Chat2. Pani puri/ sevpuri']);
    expect(
      within(rows[4]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Chai Tapri', '', 'L.S. (30pax)', '5000/-', '1. Maggie2. Tea']);
    expect(
      within(rows[5]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Drinks', '', '30', '80/-', '1. Mint Mojito']);
    expect(
      within(rows[6]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual([
      'Dinner - poolside',
      '',
      '30',
      '900/-',
      '1. Veg Manchow Soup2. Veg Manchurian3. Paneer Tikka4. Jeera Rice5. Dal Fry6. Veg Kolhapuri7. Paneer Bhurji8. Tandoori Roti9. Fulke10. Butter on the side11. Peanut Salad12. Veg Raita13. Green Salad14. Rabdi Jalebi15. Gulabjamun16. Kulfi',
    ]);
    expect(
      within(rows[7]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Engagement Cake', '', 'L.S. (30pax)', '3000/-', '']);
  });

  it('renders the 11/12/2026 Event Details table exactly, Muhurta merged with time only', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details – 11/12/2026' });
    const rows = within(table).getAllByRole('row');
    // Header + Breakfast, Starter, Chaat Counter, Welcome Drink, Muhurta,
    // Lunch = 7.
    expect(rows).toHaveLength(7);

    expect(
      within(rows[1]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual([
      'Breakfast',
      '8am to 9:30am',
      '50',
      '350/-',
      '1. Tea2. Coffee3. Hot Milk4. Aloo paratha with Butter5. Curd6. Poha7. Idli8. Coconut Chutney (Green Spicy)9. Cornflakes/Chocos10. Mix Fruit Juice11. Cut Fruits',
    ]);
    expect(
      within(rows[2]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Starter', '', '300', '180/-', '1. Spring Roll2. Cheese potato bites']);
    expect(
      within(rows[3]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Chaat Counter', '', 'L.S. (300pax)', '45000/-', '1. Pani puri2. Sev puri']);
    expect(
      within(rows[4]!)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['Welcome Drink - moving', '10:30am to 11am', '300', '210/-', '1. Thandai2. Juice3. Cold drinks']);
    // Muhurta: time set, no venue — "Name Time" per the AC's own literal
    // example (this renderer's "to" join, not the PDF's own one-off "–").
    const muhurtaCell = rows[5]!.querySelector('td')!;
    expect(muhurtaCell.textContent).toBe('Muhurta 11am to 12:30pm');

    const lunchRow = rows[6]!;
    expect(
      within(lunchRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
        .slice(0, 4)
    ).toEqual(['Lunch', '12:30pm to 3pm', '300', '1200/-']);
    expect(within(lunchRow).getByText('1. Spring Roll')).toBeInTheDocument();
    expect(within(lunchRow).getByText('26. Ice – Cream with Choco syrup')).toBeInTheDocument();
  });

  it('reproduces the exact printed Total Cost Summary figures: Food Cost 597150/627007.5, Grand Total Rs. 10,73,208 /-', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Total Cost Summary' });

    const poolsideBlockLabel = within(table).getByText('Wedding Venue and Catering – 10/12/2026');
    expect(poolsideBlockLabel).toHaveAttribute('rowspan', '7');
    expect(within(table).getByText('Wedding Venue and Catering – 11/12/2026')).toHaveAttribute('rowspan', '6');

    const foodCostRow = within(table).getByText('Food Cost').closest('tr')!;
    expect(within(foodCostRow).getByText('597150')).toBeInTheDocument();
    expect(within(foodCostRow).getByText('627007.5')).toBeInTheDocument();

    const accommodationRow = within(table).getByText('Accommodation').closest('tr')!;
    expect(within(accommodationRow).getByText('109200')).toBeInTheDocument();

    const decorationRow = within(table).getByText('Decoration').closest('tr')!;
    expect(
      within(decorationRow).getByText('poolside engg sangeet + Wedding(Vidhi mandap with saptapadi)')
    ).toBeInTheDocument();
    expect(within(decorationRow).getByText('150000')).toBeInTheDocument();
    expect(within(table).getByText('Bhatji').closest('tr')!).toHaveTextContent('wedding');

    const grandTotalRow = within(table).getByText('Grand Total').closest('tr')!;
    expect(within(grandTotalRow).getByText('Rs. 10,73,208 /-')).toBeInTheDocument();
  });

  it('renders the static footer verbatim: 13 Terms & Conditions bullets, 6 Documents, Bank Details, closing lines', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    expect(within(screen.getByRole('list', { name: 'Terms & Conditions' })).getAllByRole('listitem')).toHaveLength(13);
    expect(
      within(screen.getByRole('list', { name: 'Documents Required from Bride and Groom' })).getAllByRole('listitem')
    ).toHaveLength(6);
    expect(screen.getByRole('table', { name: 'Bank Account Details' })).toBeInTheDocument();
    expect(screen.getByText('Aaradhya Adorer')).toBeInTheDocument();
    expect(screen.getByText('Regards')).toBeInTheDocument();
    expect(screen.getByText('Aaradhya Banquets')).toBeInTheDocument();
  });
});

describe('Quotation fidelity — example_quatation_2.pdf (Saish Rege)', () => {
  const clientContacts: QuotationDocumentClientContact[] = [
    { name: '', contactNumber: '', role: ClientContactRole.Bride },
    { name: '', contactNumber: '', role: ClientContactRole.Groom },
    { name: 'Mr. Saish Rege', contactNumber: '7875023468', role: ClientContactRole.POC },
  ];

  const sessions: QuotationDocumentSession[] = [
    {
      id: 'halad',
      sessionType: 'Halad',
      venue: 'Half Banquet',
      venueCost: 60000,
      startDate: '2027-02-26',
      startTime: '09:00',
      endTime: '15:00',
      pax: 150,
      sessionStatus: SessionStatus.Active,
      items: [
        {
          id: 'breakfast-halad',
          type: ItemType.Meal,
          mealName: 'Breakfast',
          pax: 150,
          costPerPlate: 240,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '08:00',
          endTime: '10:00',
          menuItemNames: ['Tea', 'Coffee', 'Pohe', 'Amboli', 'Chutney'],
        },
        {
          id: 'haldi-event',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: 'Haldi Event',
          venue: 'Half Banquet',
          startTime: '10:00',
          endTime: '13:00',
          menuItemNames: [],
        },
        {
          id: 'lunch-halad',
          type: ItemType.Meal,
          mealName: 'Lunch -',
          pax: 150,
          costPerPlate: 450,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '13:00',
          endTime: '14:30',
          menuItemNames: [
            'Plain Rice Kolam',
            'Jeera Rice',
            'Dal Fry',
            'Matki Usal',
            'Paale bhaji',
            'Chapati',
            'Solkadhi',
            'Pakoda',
            'Shrikhanda',
            'Salad',
            'Papad',
            'Pickle',
            'Saunf',
          ],
        },
        {
          id: 'take-rest',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: 'Take Rest',
          venue: 'Till 5pm',
          startTime: null,
          endTime: null,
          menuItemNames: [],
        },
      ],
    },
    {
      id: 'engagement',
      sessionType: 'Engagement',
      venue: 'Poolside/Half Banquet',
      venueCost: 60000,
      startDate: '2027-02-26',
      startTime: '18:00',
      endTime: '22:00',
      pax: 150,
      sessionStatus: SessionStatus.Active,
      items: [
        {
          id: 'hi-tea',
          type: ItemType.Meal,
          mealName: 'Hi Tea',
          pax: 150,
          costPerPlate: 180,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '17:00',
          endTime: '18:00',
          menuItemNames: ['Tea', 'Coffee', 'Mini Batata Wada'],
        },
        {
          id: 'blank-ceremony',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: null,
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: [],
        },
        {
          id: 'dinner-poolside',
          type: ItemType.Meal,
          mealName: 'Dinner - Poolside',
          pax: 150,
          costPerPlate: 500,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '20:30',
          endTime: '22:00',
          menuItemNames: [
            'Plain Rice',
            'Matar Pulao',
            'Dal Fry',
            'Mix Veg',
            'Akhha masoor',
            'Chapati/Roti',
            'Aloo Wadi',
            'Veg Raita',
            'Papad',
            'Pickle',
            'Gajar Halwa',
            'Vanilla Ice Cream',
            'Saunf',
          ],
        },
      ],
    },
    {
      id: 'wedding',
      sessionType: 'Wedding',
      venue: 'Full Banquet',
      venueCost: 120000,
      startDate: '2027-02-27',
      startTime: '09:00',
      endTime: '15:00',
      pax: 300,
      sessionStatus: SessionStatus.Active,
      items: [
        {
          id: 'breakfast-wedding',
          type: ItemType.Meal,
          mealName: 'Breakfast',
          pax: 150,
          costPerPlate: 180,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '08:00',
          endTime: '09:30',
          menuItemNames: ['Tea', 'Pohe', 'Sheera'],
        },
        {
          id: 'welcome-drink',
          type: ItemType.Meal,
          mealName: 'Welcome Drink',
          pax: 300,
          costPerPlate: 30,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '10:30',
          endTime: '11:00',
          menuItemNames: [],
        },
        {
          id: 'muhurta',
          type: ItemType.Event,
          mealName: null,
          pax: null,
          costPerPlate: null,
          limitedSeating: null,
          eventName: 'Muhurta',
          venue: null,
          startTime: null,
          endTime: null,
          menuItemNames: [],
        },
        {
          id: 'lunch-wedding',
          type: ItemType.Meal,
          mealName: 'Lunch',
          pax: 300,
          costPerPlate: 500,
          limitedSeating: false,
          eventName: null,
          venue: null,
          startTime: '12:30',
          endTime: '15:00',
          menuItemNames: [
            'Plain Rice',
            'Masale Bhaat',
            'Dal Fry',
            'Mix Veg Kaju Kurma',
            'Bharla Wanga',
            'Puri',
            'Fulke',
            'Solkadhi',
            'Mix Pakoda',
            'Papad',
            'Pickle',
            'Salad',
            'Basundi',
            'Vanilla Ice Cream with Choco toping',
          ],
        },
      ],
    },
  ];

  const accommodation: QuotationDocumentAccommodation = {
    checkIn: '2027-02-25',
    checkOut: '2027-02-27',
    totalDays: 2,
    roomLines: [
      { roomType: 'Delux', occupancy: 2, tariff: 2800, noOfRooms: 14, totalInclGst: 82320 },
      { roomType: 'Executive', occupancy: 3, tariff: 3800, noOfRooms: 2, totalInclGst: 15960 },
      { roomType: 'Dormatory', occupancy: 6, tariff: 6000, noOfRooms: 2, totalInclGst: 25200 },
      { roomType: 'Extra Beds', occupancy: 1, tariff: 700, noOfRooms: 0, totalInclGst: 0 },
    ],
    totalOccupancy: 46,
    totalCharges: 123480,
  };

  const extraLineItems: QuotationDocumentManualLineItem[] = [
    { name: 'Decoration', note: null, amount: 170000 },
    { name: 'Photographer', note: null, amount: 0 },
    { name: 'Bhatji', note: 'wedding', amount: 5000 },
  ];

  it('renders the Client Details table exactly (3 rows, both Bride and Groom wholly blank)', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Client Details' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
      )
    ).toEqual([
      ['Bride', '', ''],
      ['Groom', '', ''],
      ['Point of Contact', 'Mr. Saish Rege', '7875023468'],
    ]);
  });

  it('renders the Event Details summary table exactly (3 rows, Halad+Engagement sharing a date)', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
      )
    ).toEqual([
      ['Halad', '26/02/2027', '9am to 3pm', '150', 'Half Banquet', '60,000/-'],
      ['Engagement', '26/02/2027', '6pm to 10pm', '150', 'Poolside/Half Banquet', '60,000/-'],
      ['Wedding', '27/02/2027', '9am to 3pm', '300', 'Full Banquet', '1,20,000/-'],
    ]);
  });

  it('renders Accommodation Details exactly, including Extra Beds with occupancy 1', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Accommodation Details' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent)
          .slice(-5)
      )
    ).toEqual([
      ['Delux', '2', '2800', '14', '82320'],
      ['Executive', '3', '3800', '2', '15960'],
      ['Dormatory', '6', '6000', '2', '25200'],
      ['Extra Beds', '1', '700', '0', '0'],
      ['Total Occ.', '46', '', 'Total Charges', 'Rs. 1,23,480 /-'],
    ]);
    const checkInCell = within(rows[0]!).getAllByRole('cell')[0]!;
    expect(checkInCell.textContent).toBe('25-02-202712pm');
    const checkOutCell = within(rows[0]!).getAllByRole('cell')[1]!;
    expect(checkOutCell.textContent).toBe('27-02-202711am');
  });

  it('pools Halad+Engagement into one 26/02/2027 table, preserving Session-then-own-item order, with the wholly-blank Ceremony row', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details – 26/02/2027' });
    const rows = within(table).getAllByRole('row');
    // Header + Breakfast, Haldi Event, Lunch -, Take Rest (Halad) + Hi Tea,
    // blank Ceremony, Dinner - Poolside (Engagement) = 8.
    expect(rows).toHaveLength(8);

    expect(within(rows[1]!).getByText('Breakfast')).toBeInTheDocument();
    const haldiEventCell = within(rows[2]!).getAllByRole('cell')[0]!;
    expect(haldiEventCell.textContent).toBe('Haldi Event 10am to 1pm - Half Banquet');
    expect(within(rows[3]!).getByText('Lunch -')).toBeInTheDocument();
    const takeRestCell = within(rows[4]!).getAllByRole('cell')[0]!;
    expect(takeRestCell.textContent).toBe('Take Rest - Till 5pm');
    expect(within(rows[5]!).getByText('Hi Tea')).toBeInTheDocument();
    const blankCeremonyCell = within(rows[6]!).getAllByRole('cell')[0]!;
    expect(blankCeremonyCell).toHaveAttribute('colspan', '5');
    expect(blankCeremonyCell.textContent).toBe('');
    expect(within(rows[7]!).getByText('Dinner - Poolside')).toBeInTheDocument();
  });

  it('renders the 27/02/2027 Event Details table exactly, bare Muhurta (no time, no venue)', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Event Details – 27/02/2027' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(5);

    expect(within(rows[1]!).getByText('Breakfast')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Welcome Drink')).toBeInTheDocument();
    const muhurtaCell = within(rows[3]!).getAllByRole('cell')[0]!;
    expect(muhurtaCell.textContent).toBe('Muhurta');
    expect(within(rows[4]!).getByText('Lunch')).toBeInTheDocument();
  });

  it('reproduces the exact printed Total Cost Summary figures: Food Cost 391500/411075, Grand Total Rs. 9,49,555 /-', () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    const table = screen.getByRole('table', { name: 'Total Cost Summary' });

    // One venue row per Session sharing 26/02/2027 (Halad, Engagement), not
    // one for the date — verified distinctly rather than merged into one.
    const halfBanquetRow = within(table).getByText('Half Banquet').closest('tr')!;
    expect(within(halfBanquetRow).getByText('60000')).toBeInTheDocument();
    // Session.venue printed verbatim ("Poolside/Half Banquet"), not the
    // reference PDF's own unexplained "Poolside" shorthand — see this
    // file's own top-of-file comment (divergence #1).
    const engagementVenueRow = within(table).getByText('Poolside/Half Banquet').closest('tr')!;
    expect(within(engagementVenueRow).getAllByRole('cell').at(-1)!.textContent).toBe('60000');

    const foodCostRow = within(table).getByText('Food Cost').closest('tr')!;
    expect(within(foodCostRow).getByText('391500')).toBeInTheDocument();
    expect(within(foodCostRow).getByText('411075')).toBeInTheDocument();

    // Divergence #2 (this file's own top-of-file comment): real entry
    // order (Breakfast, Welcome Drink, Lunch) is preserved for the
    // 27/02/2027 block, not the reference PDF's own inconsistent
    // "Breakfast, Lunch, welcome drink" — asserted here directly, not just
    // claimed in a comment, so a future accidental reorder is caught.
    // Scoped to exactly this block's own 4 rows (1 venue + 3 food), since
    // "Breakfast" also appears, unscoped, in the 26/02/2027 block above.
    const rows = within(table).getAllByRole('row');
    const weddingBlockLabelCell = within(table).getByText('Wedding Venue and Catering – 27/02/2027');
    expect(weddingBlockLabelCell).toHaveAttribute('rowspan', '4');
    const weddingBlockStart = rows.indexOf(weddingBlockLabelCell.closest('tr')!);
    const weddingBlockRows = rows.slice(weddingBlockStart, weddingBlockStart + 4);
    const weddingFoodRowLabels = weddingBlockRows
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]!.textContent);
    expect(weddingFoodRowLabels).toEqual(['Breakfast', 'Welcome Drink', 'Lunch']);

    const accommodationRow = within(table).getByText('Accommodation').closest('tr')!;
    expect(within(accommodationRow).getByText('123480')).toBeInTheDocument();

    const decorationRow = within(table).getByText('Decoration').closest('tr')!;
    expect(within(decorationRow).getAllByRole('cell')[1]!.textContent).toBe('');
    expect(within(decorationRow).getByText('170000')).toBeInTheDocument();

    const bhatjiRow = within(table).getByText('Bhatji').closest('tr')!;
    expect(within(bhatjiRow).getByText('wedding')).toBeInTheDocument();
    expect(within(bhatjiRow).getByText('5000')).toBeInTheDocument();

    const grandTotalRow = within(table).getByText('Grand Total').closest('tr')!;
    expect(within(grandTotalRow).getByText('Rs. 9,49,555 /-')).toBeInTheDocument();
  });

  it("renders the static footer identically to example_quatation_1.pdf's own fixture (same fixed constants, no per-Event drift)", () => {
    renderFixture({ clientContacts, sessions, accommodation, extraLineItems });

    expect(within(screen.getByRole('list', { name: 'Terms & Conditions' })).getAllByRole('listitem')).toHaveLength(13);
    expect(
      within(screen.getByRole('list', { name: 'Documents Required from Bride and Groom' })).getAllByRole('listitem')
    ).toHaveLength(6);
    expect(screen.getByText('Aaradhya Adorer')).toBeInTheDocument();
    expect(screen.getByText('Regards')).toBeInTheDocument();
    expect(screen.getByText('Aaradhya Banquets')).toBeInTheDocument();
  });
});
