import type { z } from 'zod';
import { type banquetEventOrderSessionSchema, SeatingArrangement } from '../../contract';
import { formatSessionDuration } from '../../utils/quotation-formatting';
import { formatDateRange } from '../event-detail/event-summary';

export type BanquetEventOrderSession = z.infer<typeof banquetEventOrderSessionSchema>;

// The House Keeping line for each seating, as the reference prints it
// ("Square Table Setup"). Other has no printable name — its details go in
// the setup notes, which follow.
const SEATING_SETUP_LABELS: Record<SeatingArrangement, string | null> = {
  [SeatingArrangement.Theatre]: 'Theatre Setup',
  [SeatingArrangement.RoundTables]: 'Round Table Setup',
  [SeatingArrangement.SquareTables]: 'Square Table Setup',
  [SeatingArrangement.Classroom]: 'Classroom Setup',
  [SeatingArrangement.UShape]: 'U-Shape Setup',
  [SeatingArrangement.Cluster]: 'Cluster Setup',
  [SeatingArrangement.Other]: null,
};

const SETUP_TOGGLE_LINES: {
  key: 'stage' | 'buffet' | 'registrationDesk' | 'vipSeating' | 'brideGroomSeating';
  label: string;
}[] = [
  { key: 'stage', label: 'Stage' },
  { key: 'buffet', label: 'Buffet' },
  { key: 'registrationDesk', label: 'Registration desk' },
  { key: 'vipSeating', label: 'VIP seating' },
  { key: 'brideGroomSeating', label: 'Bride/Groom seating' },
];

export interface BeoDetailRow {
  label: string;
  value: string;
}

export interface BeoMenuGroup {
  heading: string;
  items: string[];
}

export interface BeoKitchen {
  paxLines: string[];
  menus: BeoMenuGroup[];
}

// One department box on the right of "Notes To Departments".
export interface BeoDepartmentBox {
  title: string;
  lines: string[];
}

export interface BeoPage {
  id: string;
  functionType: string;
  details: BeoDetailRow[];
  // null when there's nothing for the kitchen (the box is omitted).
  kitchen: BeoKitchen | null;
  departments: BeoDepartmentBox[];
}

const formatTime = (startTime: string | null, endTime: string | null): string =>
  formatSessionDuration(startTime ?? '', endTime ?? '');

const buildKitchen = (session: BanquetEventOrderSession): BeoKitchen | null => {
  const { vegPax, nonVegPax } = session.departmentNotes;
  const paxLines = [
    vegPax === null ? null : `Veg – ${vegPax} pax`,
    nonVegPax === null ? null : `Non-Veg – ${nonVegPax} pax`,
  ].filter((line): line is string => line !== null);
  const menus = session.meals.map((meal) => {
    const time = formatTime(meal.startTime, meal.endTime);
    return { heading: time ? `${meal.mealName} (${time})` : meal.mealName, items: meal.menuItems };
  });
  if (paxLines.length === 0 && menus.length === 0) {
    return null;
  }
  return { paxLines, menus };
};

// 5B.3: the seating + " Setup", "N Tables / N Chairs", each enabled toggle,
// each ceremony as "<name> Setup", then the setup notes.
export const buildHousekeepingLines = (session: BanquetEventOrderSession): string[] => {
  const { setup } = session;
  const lines: string[] = [];
  const seatingLine = setup.seating ? SEATING_SETUP_LABELS[setup.seating] : null;
  if (seatingLine) {
    lines.push(seatingLine);
  }
  if (setup.tableCount > 0 || setup.chairCount > 0) {
    lines.push(`${setup.tableCount} Tables / ${setup.chairCount} Chairs`);
  }
  for (const toggle of SETUP_TOGGLE_LINES) {
    if (setup[toggle.key]) {
      lines.push(toggle.label);
    }
  }
  lines.push(...session.ceremonies.map((name) => `${name} Setup`));
  if (setup.notes) {
    lines.push(setup.notes);
  }
  return lines;
};

/**
 * One Banquet Event Order page for a session (5B.3, `notes_for_department.pdf`):
 * the details table, the Kitchen/Menu box and the House Keeping /
 * Maintainance / Restaurant boxes — an empty box is omitted. The reference's
 * "Maintainance" spelling is kept.
 */
export const buildBeoPage = (clientName: string, session: BanquetEventOrderSession): BeoPage => {
  const departments: BeoDepartmentBox[] = [
    { title: 'House Keeping', lines: buildHousekeepingLines(session) },
    { title: 'Maintainance', lines: session.departmentNotes.maintenance },
    {
      title: 'Restaurant',
      lines: session.departmentNotes.restaurantNote ? [session.departmentNotes.restaurantNote] : [],
    },
  ];
  return {
    id: session.id,
    functionType: session.sessionType,
    details: [
      { label: 'Client name', value: clientName },
      { label: 'Date', value: formatDateRange(session.startDate.slice(0, 10), session.endDate.slice(0, 10)) },
      { label: 'Time', value: formatTime(session.startTime, session.endTime) || '—' },
      { label: 'Number of Pax', value: String(session.pax) },
      { label: 'Venue', value: session.venue },
      { label: 'Function Type', value: session.sessionType },
    ],
    kitchen: buildKitchen(session),
    departments: departments.filter((box) => box.lines.length > 0),
  };
};
