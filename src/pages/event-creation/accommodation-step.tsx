import { type ReactNode, useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import AccommodationTotals from '../../components/ui/accommodation-totals';
import DiscountPercentField from '../../components/ui/discount-percent-field';
import type { roomTypeResultSchema } from '../../contract';
import { useEventWizard } from '../../stores/event-wizard-context';
import {
  computeDiscount,
  computeFinalAmount,
  computeTotalCharges,
  computeTotalNights,
  computeTotalOccupancy,
  parseDiscountPercent,
} from '../../utils/accommodation-calculations';
import { formatEventDate, formatTimeOfDay } from '../../utils/quotation-formatting';
import { fromPickerDate, toPickerDate } from '../event-detail/date-input';
import { formatRupees } from '../event-detail/format-amount';
import AccommodationRoomLines, { type RoomLineNumberField, type WizardRoomLine } from './accommodation-room-lines';
import {
  addButtonStyles,
  dateColumnStyles,
  dateRowStyles,
  discountFieldStyles,
  formCardStyles,
  loadingStyles,
  nightsCountStyles,
  nightsLabelStyles,
  nightsPanelStyles,
  roomsCardStyles,
  roomsSectionStyles,
  summaryLineStyles,
  wrapperStyles,
} from './accommodation-step.styles';
import TimePickerCard from './time-picker-card';

export type { WizardRoomLine } from './accommodation-room-lines';

// The default seeded room line SRS §4.3 says both reference quotations
// always print, even at zero — this exact name, matching seed-config.ts's
// own seeded Room Type Master entry (STORY-061).
const EXTRA_BEDS_ROOM_TYPE = 'Extra Beds';

// D8: a new event starts with Delux 14 · Executive 2 · Family Room 2 ·
// Extra Beds 0, keyed by the seeded master names. Any other active Room
// Type starts at 0 rooms.
const DEFAULT_ROOM_COUNTS: Readonly<Record<string, number>> = {
  Delux: 14,
  Executive: 2,
  'Family Room': 2,
  [EXTRA_BEDS_ROOM_TYPE]: 0,
};

interface AccommodationStepData {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomLines: WizardRoomLine[];
  discountPercent?: number;
}

type RoomTypeMasterEntry = z.infer<typeof roomTypeResultSchema>;

const isAccommodationStepData = (value: unknown): value is AccommodationStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as AccommodationStepData).roomLines);

const createRowId = (): string => `room-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// One row per active Room Type Master entry, with D8's default room counts
// and the master's occupancy and tariff; only the Extra Beds row is locked
// from removal. If the master has no active Extra Beds entry (e.g.
// deactivated), a synthetic zeroed row is still appended so the "always
// present, never removable" guarantee holds regardless of master-list state.
const buildDefaultRoomLines = (activeRoomTypes: RoomTypeMasterEntry[]): WizardRoomLine[] => {
  const rows = activeRoomTypes.map((roomType) => ({
    id: createRowId(),
    roomType: roomType.name,
    occupancy: roomType.occupancy,
    tariff: roomType.defaultTariff,
    noOfRooms: DEFAULT_ROOM_COUNTS[roomType.name] ?? 0,
    locked: roomType.name === EXTRA_BEDS_ROOM_TYPE,
  }));
  if (!rows.some((row) => row.locked)) {
    rows.push({
      id: createRowId(),
      roomType: EXTRA_BEDS_ROOM_TYPE,
      occupancy: 0,
      tariff: 0,
      noOfRooms: 0,
      locked: true,
    });
  }
  return rows;
};

const formatStayMoment = (date: string, time: string): string =>
  date ? `${formatEventDate(date)}${time ? ` · ${formatTimeOfDay(time)}` : ''}` : '—';

// Wizard Step 3 (STORY-066, restyled for DEV-07 — Figma 05 New Event / 3
// Accommodation). One Accommodation Block for the whole Event (SRS §4.3 —
// not per Session), local state mirrored into the wizard store on every
// change, same pattern event-details-step.tsx already established.
const AccommodationStep = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { data, setStepData } = useEventWizard();
  const stored = data['accommodation'];
  const restored = isAccommodationStepData(stored) ? stored : undefined;
  // Frozen at mount (a ref, not the live `restored` above) — this
  // component's own mirror-to-store effect below writes a real (if empty)
  // accommodation object into the wizard store on its very first run, which
  // would otherwise make `restored` look truthy by the time the seed
  // effect's dependency (isMasterListsLoading) actually flips to false,
  // permanently blocking the seed from ever running.
  const hadStoredDataAtMount = useRef(restored !== undefined).current;

  const [checkInDate, setCheckInDate] = useState(restored?.checkInDate ?? '');
  const [checkInTime, setCheckInTime] = useState(restored?.checkInTime ?? '');
  const [checkOutDate, setCheckOutDate] = useState(restored?.checkOutDate ?? '');
  const [checkOutTime, setCheckOutTime] = useState(restored?.checkOutTime ?? '');
  const [rows, setRows] = useState<WizardRoomLine[]>(restored?.roomLines ?? []);
  // The raw field text, so an invalid entry stays visible beside its error.
  const [discountInput, setDiscountInput] = useState(String(restored?.discountPercent ?? 0));

  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'] });
  const activeRoomTypes = (roomTypesQuery.data?.body ?? []).filter((roomType) => roomType.active);

  // Same "don't render the form until its master-list options actually
  // exist" gate event-details-step.tsx already uses.
  const isMasterListsLoading = roomTypesQuery.isPending;

  // Seeds the default Room Lines exactly once, only when nothing was
  // already restored from a previous visit to this step — a ref guard
  // (not a rows.length check) so a legitimate state of "user removed every
  // removable row, leaving only the locked one" is never re-seeded.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || isMasterListsLoading || hadStoredDataAtMount) {
      return;
    }
    seededRef.current = true;
    setRows(buildDefaultRoomLines(activeRoomTypes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMasterListsLoading]);

  const parsedDiscount = parseDiscountPercent(discountInput);
  const isDiscountInvalid = parsedDiscount === null;

  // An invalid discount is stored as NaN, which the step's readiness check
  // (wizard-step-readiness.ts) rejects, keeping Next disabled.
  useEffect(() => {
    setStepData('accommodation', {
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      roomLines: rows,
      discountPercent: parsedDiscount ?? Number.NaN,
    });
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, rows, parsedDiscount, setStepData]);

  // Blocked with a validation message rather than letting total_nights go
  // negative — plain string comparison, same "'YYYY-MM-DD' sorts
  // lexicographically the same as chronologically" reasoning
  // event-details-step.tsx's own endDate check documents.
  const isRangeInvalid = Boolean(checkInDate) && Boolean(checkOutDate) && checkOutDate < checkInDate;
  const totalNights = !isRangeInvalid ? computeTotalNights(checkInDate, checkOutDate) : null;
  // A room line entered before check-in/check-out are both set still needs
  // some total to display — falls back to 1 (matching aaradhya-api's own
  // identical fallback) rather than reading 0 until dates are chosen.
  const totalNightsForMath = totalNights ?? 1;

  const handleAddRoomLine = () => {
    setRows((current) => [
      ...current,
      { id: createRowId(), roomType: '', occupancy: 0, tariff: 0, noOfRooms: 0, locked: false },
    ]);
  };

  const handleRemoveRoomLine = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  // Picking a Room Type copies its master occupancy (read-only) and default
  // tariff (still editable).
  const handleRoomTypeChange = (id: string, roomTypeName: string) => {
    const selected = activeRoomTypes.find((roomType) => roomType.name === roomTypeName);
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              roomType: roomTypeName,
              occupancy: selected?.occupancy ?? 0,
              tariff: selected ? selected.defaultTariff : row.tariff,
            }
          : row
      )
    );
  };

  const handleNumberFieldChange = (id: string, field: RoomLineNumberField, rawValue: string) => {
    const value = rawValue === '' ? 0 : Number(rawValue);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const totalCharges = computeTotalCharges(rows, totalNightsForMath);
  const discountPercent = parsedDiscount ?? 0;
  const discountAmount = computeDiscount(totalCharges, discountPercent);
  const totals = {
    totalOccupancy: computeTotalOccupancy(rows),
    totalCharges,
    discountPercent,
    discountAmount,
    finalAmount: computeFinalAmount(totalCharges, discountAmount),
  };

  if (isMasterListsLoading) {
    return (
      <Stack sx={loadingStyles}>
        <CircularProgress aria-label="Loading room type options" />
      </Stack>
    );
  }

  const summaryLine = `${formatStayMoment(checkInDate, checkInTime)} to ${formatStayMoment(checkOutDate, checkOutTime)} · Total nights: ${totalNights ?? '—'}`;

  const roomLines = (
    <AccommodationRoomLines
      rows={rows}
      roomTypeOptions={activeRoomTypes}
      totalNights={totalNightsForMath}
      isDesktop={isDesktop}
      onRoomTypeChange={handleRoomTypeChange}
      onNumberChange={handleNumberFieldChange}
      onRemove={handleRemoveRoomLine}
    />
  );

  const totalsBlock = (
    <AccommodationTotals
      totals={totals}
      formatMoney={formatRupees}
      leading={
        <Button variant="tonal" onClick={handleAddRoomLine} startIcon={<AddIcon />} sx={addButtonStyles}>
          Add Room Line
        </Button>
      }
      discountField={
        <DiscountPercentField
          value={discountInput}
          onChange={setDiscountInput}
          isInvalid={isDiscountInvalid}
          sx={discountFieldStyles}
        />
      }
    />
  );

  // Desktop: one card holds the table and the totals (Figma); mobile: a
  // "Rooms" heading over the line cards and the totals.
  let roomsSection: ReactNode;
  if (isDesktop) {
    roomsSection = (
      <Paper elevation={0} sx={roomsCardStyles}>
        {roomLines}
        {totalsBlock}
      </Paper>
    );
  } else {
    roomsSection = (
      <Stack sx={roomsSectionStyles}>
        <Typography variant="titleS" component="h2">
          Rooms
        </Typography>
        {roomLines}
        {totalsBlock}
      </Stack>
    );
  }

  return (
    <Stack sx={wrapperStyles}>
      <Paper elevation={0} sx={formCardStyles}>
        <Typography variant="titleM" component="h2">
          Accommodation
        </Typography>
        {/* DatePicker + StaticTimePicker pairs (the always-visible clock
            face, SRS §6.9 — not TimePicker's popover-only one), matching
            the reference quotations' date-then-time two-line display for
            Check-in/Check-out. */}
        <Box sx={dateRowStyles}>
          <Stack sx={dateColumnStyles}>
            <Typography variant="titleS" component="h3">
              Check-in
            </Typography>
            <DatePicker
              label="Check-in date"
              value={toPickerDate(checkInDate)}
              onChange={(date) => setCheckInDate(fromPickerDate(date))}
            />
            <TimePickerCard value={checkInTime} onChange={setCheckInTime} />
          </Stack>
          <Stack sx={dateColumnStyles}>
            <Typography variant="titleS" component="h3">
              Check-out
            </Typography>
            <DatePicker
              label="Check-out date"
              value={toPickerDate(checkOutDate)}
              onChange={(date) => setCheckOutDate(fromPickerDate(date))}
              slotProps={{ textField: { error: isRangeInvalid } }}
            />
            <TimePickerCard value={checkOutTime} onChange={setCheckOutTime} />
          </Stack>
          {/* Never manually entered — always derived from the dates. The
              big count is desktop-only (Figma); mobile shows the line. */}
          <Box sx={nightsPanelStyles}>
            <Typography variant="labelS" component="p" sx={nightsLabelStyles}>
              Total nights
            </Typography>
            <Typography variant="display" component="p" aria-hidden sx={nightsCountStyles}>
              {totalNights ?? '—'}
            </Typography>
            <Typography variant="bodyM" sx={summaryLineStyles}>
              {summaryLine}
            </Typography>
          </Box>
        </Box>
        {isRangeInvalid && <Alert severity="error">Check-out must be on or after check-in.</Alert>}
      </Paper>

      {roomsSection}
    </Stack>
  );
};

export default AccommodationStep;
