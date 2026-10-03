import { type ReactNode, useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tsr } from '../../api/client';
import AccommodationTotals from '../../components/ui/accommodation-totals';
import DiscountPercentField from '../../components/ui/discount-percent-field';
import { getRangeEndDateProps, isEndBeforeStart } from '../../components/ui/range-end-date-props';
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
import { buildRoomLines, createRoomLineId, DEFAULT_ROOM_COUNTS } from './room-line-defaults';
import TimePickerCard from './time-picker-card';

export type { WizardRoomLine } from './accommodation-room-lines';

interface AccommodationStepData {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomLines: WizardRoomLine[];
  discountPercent?: number;
  // DEV-11 (D8): set by the One Day Event prefill — check-in/check-out may
  // stay empty (no rooms booked yet), and the charges read ₹ 0 until both
  // are set. Absent for every other wizard.
  datesOptional?: boolean;
}

const isAccommodationStepData = (value: unknown): value is AccommodationStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as AccommodationStepData).roomLines);

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
  const datesOptional = restored?.datesOptional === true;

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
    setRows(buildRoomLines(activeRoomTypes, DEFAULT_ROOM_COUNTS));
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
      datesOptional,
    });
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, rows, parsedDiscount, datesOptional, setStepData]);

  // Blocked with a validation message rather than letting total_nights go
  // negative — plain string comparison, same "'YYYY-MM-DD' sorts
  // lexicographically the same as chronologically" reasoning
  // event-details-step.tsx's own endDate check documents.
  const isRangeInvalid = isEndBeforeStart(checkInDate, checkOutDate);

  // V5: moving check-in past check-out clears check-out.
  const handleCheckInDateChange = (nextCheckInDate: string) => {
    setCheckInDate(nextCheckInDate);
    if (isEndBeforeStart(nextCheckInDate, checkOutDate)) {
      setCheckOutDate('');
    }
  };
  const totalNights = !isRangeInvalid ? computeTotalNights(checkInDate, checkOutDate) : null;
  // A room line entered before check-in/check-out are both set still needs
  // some total to display — falls back to 1 (matching aaradhya-api's own
  // identical fallback) rather than reading 0 until dates are chosen — except
  // a One Day Event's rooms, which read ₹ 0 until dates are set (D8).
  const totalNightsForMath = totalNights ?? (datesOptional ? 0 : 1);

  const handleAddRoomLine = () => {
    setRows((current) => [
      ...current,
      { id: createRoomLineId(), roomType: '', occupancy: 0, tariff: 0, noOfRooms: 0, locked: false },
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
              onChange={(date) => handleCheckInDateChange(fromPickerDate(date))}
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
              {...getRangeEndDateProps(checkInDate)}
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
