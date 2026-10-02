import type { z } from 'zod';
import type { roomTypeResultSchema } from '../../contract';
import type { WizardRoomLine } from './accommodation-room-lines';

type RoomTypeMasterEntry = Pick<z.infer<typeof roomTypeResultSchema>, 'name' | 'occupancy' | 'defaultTariff'>;

// The default seeded room line SRS §4.3 says both reference quotations
// always print, even at zero — this exact name, matching seed-config.ts's
// own seeded Room Type Master entry (STORY-061).
export const EXTRA_BEDS_ROOM_TYPE = 'Extra Beds';

// D8: a new event starts with Delux 14 · Executive 2 · Family Room 2 ·
// Extra Beds 0, keyed by the seeded master names. Any other active Room
// Type starts at 0 rooms.
export const DEFAULT_ROOM_COUNTS: Readonly<Record<string, number>> = {
  Delux: 14,
  Executive: 2,
  'Family Room': 2,
  [EXTRA_BEDS_ROOM_TYPE]: 0,
};

export const createRoomLineId = (): string => `room-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// One row per active Room Type Master entry, with the given room counts
// (absent = 0) and the master's occupancy and tariff; only the Extra Beds
// row is locked from removal. If the master has no active Extra Beds entry
// (e.g. deactivated), a synthetic zeroed row is still appended so the
// "always present, never removable" guarantee holds regardless of
// master-list state. Used by step 3's defaults and the One Day Event
// template's rooms (DEV-11).
export const buildRoomLines = (
  activeRoomTypes: RoomTypeMasterEntry[],
  roomCounts: Readonly<Record<string, number>>
): WizardRoomLine[] => {
  const rows = activeRoomTypes.map((roomType) => ({
    id: createRoomLineId(),
    roomType: roomType.name,
    occupancy: roomType.occupancy,
    tariff: roomType.defaultTariff,
    noOfRooms: roomCounts[roomType.name] ?? 0,
    locked: roomType.name === EXTRA_BEDS_ROOM_TYPE,
  }));
  if (!rows.some((row) => row.locked)) {
    rows.push({
      id: createRoomLineId(),
      roomType: EXTRA_BEDS_ROOM_TYPE,
      occupancy: 0,
      tariff: 0,
      noOfRooms: 0,
      locked: true,
    });
  }
  return rows;
};
