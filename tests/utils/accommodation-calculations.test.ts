import { describe, expect, it } from 'vitest';
import {
  computeRoomLineTotalInclGst,
  computeTotalCharges,
  computeTotalDays,
  computeTotalOccupancy,
} from '../../src/utils/accommodation-calculations';

describe('computeRoomLineTotalInclGst', () => {
  it('computes tariff × rooms, GST-inclusive at 18%', () => {
    expect(computeRoomLineTotalInclGst({ tariff: 4000, noOfRooms: 3 })).toBe(14160);
  });

  it('computes to 0 for a placeholder row with 0 rooms', () => {
    expect(computeRoomLineTotalInclGst({ tariff: 800, noOfRooms: 0 })).toBe(0);
  });
});

describe('computeTotalOccupancy', () => {
  it('sums occupancy × rooms across lines', () => {
    expect(
      computeTotalOccupancy([
        { occupancy: 2, tariff: 4000, noOfRooms: 3 },
        { occupancy: 4, tariff: 1500, noOfRooms: 1 },
      ]),
    ).toBe(10);
  });
});

describe('computeTotalCharges', () => {
  it('sums each line’s GST-inclusive total', () => {
    expect(
      computeTotalCharges([
        { occupancy: 2, tariff: 4000, noOfRooms: 3 },
        { occupancy: 4, tariff: 1500, noOfRooms: 1 },
      ]),
    ).toBe(14160 + 1770);
  });
});

describe('computeTotalDays', () => {
  it('is inclusive of both check-in and check-out dates', () => {
    expect(computeTotalDays('2026-12-10', '2026-12-12')).toBe(3);
  });

  it('is 1 for a same-day stay', () => {
    expect(computeTotalDays('2026-12-10', '2026-12-10')).toBe(1);
  });

  it('returns null when either date is missing', () => {
    expect(computeTotalDays('', '2026-12-12')).toBeNull();
    expect(computeTotalDays('2026-12-10', '')).toBeNull();
  });
});
