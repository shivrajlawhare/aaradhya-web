import { describe, expect, it } from 'vitest';
import {
  computeRoomLineTotalInclGst,
  computeTotalCharges,
  computeTotalDays,
  computeTotalOccupancy,
} from '../../src/utils/accommodation-calculations';

describe('computeRoomLineTotalInclGst', () => {
  it('computes tariff × rooms × total_days, GST-inclusive at 5%', () => {
    // 4000 × 3 rooms × 1 day × 1.05 = 12600.
    expect(computeRoomLineTotalInclGst({ tariff: 4000, noOfRooms: 3 }, 1)).toBe(12600);
  });

  it('computes to 0 for a placeholder row with 0 rooms', () => {
    expect(computeRoomLineTotalInclGst({ tariff: 800, noOfRooms: 0 }, 1)).toBe(0);
  });

  // Verified against docs/example_quatations/example_quatation_1.pdf's own
  // printed Deluxe line (STORY-068): 2500 tariff × 14 rooms × 2 nights ×
  // 1.05 = 73,500, reproduced identically in both reference quotations.
  it('multiplies by total_days — reproduces the reference quotations’ exact printed numbers', () => {
    expect(computeRoomLineTotalInclGst({ tariff: 2500, noOfRooms: 14 }, 2)).toBe(73500);
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
    // 4000×3×1×1.05=12600; 1500×1×1×1.05=1575.
    expect(
      computeTotalCharges(
        [
          { occupancy: 2, tariff: 4000, noOfRooms: 3 },
          { occupancy: 4, tariff: 1500, noOfRooms: 1 },
        ],
        1,
      ),
    ).toBe(12600 + 1575);
  });

  // Verified against example_quatation_1.pdf's own printed "Total Charges"
  // footer cell (Rs. 1,09,200 /-).
  it('reproduces the reference quotation’s exact printed Total Charges', () => {
    const roomLines = [
      { occupancy: 2, tariff: 2500, noOfRooms: 14 },
      { occupancy: 3, tariff: 3500, noOfRooms: 2 },
      { occupancy: 6, tariff: 5000, noOfRooms: 2 },
      { occupancy: 0, tariff: 700, noOfRooms: 0 },
    ];

    expect(computeTotalCharges(roomLines, 2)).toBe(109200);
  });
});

describe('computeTotalDays', () => {
  // STORY-070 — this exact pair is example_quatation_1.pdf's own check-in/
  // check-out, which prints "Total Days: 2"; the previous "+1" inclusive
  // formula (matching the backend's since-corrected computeTotalDays)
  // returned 3 here, silently inflating every Accommodation Total computed
  // from it by 50%.
  it('counts nights stayed (check-out − check-in), not inclusive calendar days', () => {
    expect(computeTotalDays('2026-12-10', '2026-12-12')).toBe(2);
  });

  it('is 1 for a same-day stay, not 0', () => {
    expect(computeTotalDays('2026-12-10', '2026-12-10')).toBe(1);
  });

  it('returns null when either date is missing', () => {
    expect(computeTotalDays('', '2026-12-12')).toBeNull();
    expect(computeTotalDays('2026-12-10', '')).toBeNull();
  });
});
