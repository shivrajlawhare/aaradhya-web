import { useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { tsr } from '../../api/client';
import { formatAmount } from '../event-detail/format-amount';
import { fromPickerDate, fromPickerTime, toPickerDate, toPickerTime } from '../event-detail/date-input';
import { useEventWizard } from '../../stores/event-wizard-context';
import { formatEventDate, formatTimeOfDay } from '../../utils/quotation-formatting';
import {
  computeRoomLineTotalInclGst,
  computeTotalCharges,
  computeTotalDays,
  computeTotalOccupancy,
} from '../../utils/accommodation-calculations';
import {
  addButtonStyles,
  dateTimeRowStyles,
  dateTimeSectionStyles,
  footerCellStyles,
  footerStyles,
  formCardStyles,
  numericCellStyles,
  summaryLineStyles,
  tableCardStyles,
  wrapperStyles,
} from './accommodation-step.styles';

// The default seeded room line SRS §4.3 says both reference quotations
// always print, even at zero — this exact name, matching seed-config.ts's
// own seeded Room Type Master entry (STORY-061).
const EXTRA_BEDS_ROOM_TYPE = 'Extra Beds';

export interface WizardRoomLine {
  id: string;
  // Field name matches roomLineSchema (contract/index.ts) one-for-one, same
  // "ready for STORY-068's eventual submit" reasoning event-details-step.tsx's
  // own WizardSessionRow already documents.
  roomType: string;
  occupancy: number;
  tariff: number;
  noOfRooms: number;
  // The Extra Beds default row — this story's own AC: "cannot be removed."
  // Every other row, seeded or added via "+ Add Room Line," has one.
  locked: boolean;
}

interface AccommodationStepData {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomLines: WizardRoomLine[];
}

const isAccommodationStepData = (value: unknown): value is AccommodationStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as AccommodationStepData).roomLines);

const createRowId = (): string => `room-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// One row per active Room Type Master entry (Deluxe/Executive/Dormitory/
// Extra Beds as seeded, STORY-061) — this story's own AC names all four as
// "the seeded defaults," not just Extra Beds; only the Extra Beds row is
// locked from removal. If the Room Type Master has no active entry actually
// named Extra Beds (e.g. deactivated), a synthetic zeroed row is still
// appended so the "always present, never removable" guarantee holds
// regardless of master-list state.
const buildDefaultRoomLines = (activeRoomTypes: { name: string; defaultTariff: number }[]): WizardRoomLine[] => {
  const rows = activeRoomTypes.map((roomType) => ({
    id: createRowId(),
    roomType: roomType.name,
    occupancy: 0,
    tariff: roomType.defaultTariff,
    noOfRooms: 0,
    locked: roomType.name === EXTRA_BEDS_ROOM_TYPE,
  }));
  if (!rows.some((row) => row.locked)) {
    rows.push({ id: createRowId(), roomType: EXTRA_BEDS_ROOM_TYPE, occupancy: 0, tariff: 0, noOfRooms: 0, locked: true });
  }
  return rows;
};

// Wizard Step 3 (STORY-066). One Accommodation Block for the whole Event
// (SRS §4.3 — not per Session), local state mirrored into the wizard store
// on every change, same pattern event-details-step.tsx already established.
const AccommodationStep = () => {
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

  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'] });
  const activeRoomTypes = (roomTypesQuery.data?.body ?? []).filter((roomType) => roomType.active);

  // Same "don't render the form until its master-list options actually
  // exist" gate event-details-step.tsx already uses.
  const isMasterListsLoading = roomTypesQuery.isPending;

  // Seeds the four default Room Lines exactly once, only when nothing was
  // already restored from a previous visit to this step — a ref guard
  // (not a rows.length check) so a legitimate state of "user removed every
  // removable row, leaving only the locked one" is never re-seeded back to
  // four.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || isMasterListsLoading || hadStoredDataAtMount) {
      return;
    }
    seededRef.current = true;
    setRows(buildDefaultRoomLines(activeRoomTypes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMasterListsLoading]);

  useEffect(() => {
    setStepData('accommodation', { checkInDate, checkInTime, checkOutDate, checkOutTime, roomLines: rows });
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, rows, setStepData]);

  // Blocked with a validation message rather than letting total_days go
  // negative (this story's own edge case) — plain string comparison, same
  // "'YYYY-MM-DD' sorts lexicographically the same as chronologically"
  // reasoning event-details-step.tsx's own endDate check documents.
  const isRangeInvalid = Boolean(checkInDate) && Boolean(checkOutDate) && checkOutDate < checkInDate;
  const totalDays = !isRangeInvalid ? computeTotalDays(checkInDate, checkOutDate) : null;
  // A room line entered before check-in/check-out are both set still needs
  // some total to display — falls back to 1 (STORY-068's own decision,
  // matching aaradhya-api's own identical fallback) rather than always
  // reading 0 for every line until dates are chosen.
  const totalDaysForMath = totalDays ?? 1;

  const handleAddRoomLine = () => {
    setRows((current) => [...current, { id: createRowId(), roomType: '', occupancy: 0, tariff: 0, noOfRooms: 0, locked: false }]);
  };

  const handleRemoveRoomLine = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const handleRoomTypeChange = (id: string, roomTypeName: string) => {
    const selected = activeRoomTypes.find((roomType) => roomType.name === roomTypeName);
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, roomType: roomTypeName, tariff: selected ? selected.defaultTariff : row.tariff } : row,
      ),
    );
  };

  const handleNumberFieldChange = (id: string, field: 'occupancy' | 'tariff' | 'noOfRooms', rawValue: string) => {
    const value = rawValue === '' ? 0 : Number(rawValue);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const totalOccupancy = computeTotalOccupancy(rows);
  const totalCharges = computeTotalCharges(rows, totalDaysForMath);

  if (isMasterListsLoading) {
    return (
      <Stack sx={{ ...wrapperStyles, alignItems: 'center' }}>
        <CircularProgress aria-label="Loading room type options" />
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
        <Stack direction="row" sx={dateTimeRowStyles}>
          <Stack sx={dateTimeSectionStyles}>
            <Typography variant="titleM" component="h3">
              Check-in
            </Typography>
            <DatePicker label="Check-in date" value={toPickerDate(checkInDate)} onChange={(date) => setCheckInDate(fromPickerDate(date))} />
            <StaticTimePicker
              ampm
              value={toPickerTime(checkInTime)}
              onChange={(time) => setCheckInTime(fromPickerTime(time))}
            />
          </Stack>
          <Stack sx={dateTimeSectionStyles}>
            <Typography variant="titleM" component="h3">
              Check-out
            </Typography>
            <DatePicker
              label="Check-out date"
              value={toPickerDate(checkOutDate)}
              onChange={(date) => setCheckOutDate(fromPickerDate(date))}
              slotProps={{ textField: { error: isRangeInvalid } }}
            />
            <StaticTimePicker
              ampm
              value={toPickerTime(checkOutTime)}
              onChange={(time) => setCheckOutTime(fromPickerTime(time))}
            />
          </Stack>
        </Stack>
        {isRangeInvalid && <Alert severity="error">Check-out must be on or after check-in.</Alert>}
        <Typography variant="bodyM" sx={summaryLineStyles}>
          {checkInDate ? `${formatEventDate(checkInDate)}${checkInTime ? ` · ${formatTimeOfDay(checkInTime)}` : ''}` : '—'}
          {' to '}
          {checkOutDate ? `${formatEventDate(checkOutDate)}${checkOutTime ? ` · ${formatTimeOfDay(checkOutTime)}` : ''}` : '—'}
          {' · Total days: '}
          {/* Never manually entered — always derived, this story's own AC. */}
          {totalDays ?? '—'}
        </Typography>
      </Paper>

      <Paper elevation={0} sx={tableCardStyles}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="labelS">Room type</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Occupancy</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Tariff</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Rooms</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="labelS">Total (incl. GST)</Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={row.roomType}
                    onChange={(event) => handleRoomTypeChange(row.id, event.target.value)}
                    sx={{ minWidth: 160 }}
                    slotProps={{ htmlInput: { 'aria-label': `Room type for room line ${index + 1}` } }}
                  >
                    <MenuItem value="">Select a room type</MenuItem>
                    {activeRoomTypes.map((roomType) => (
                      <MenuItem key={roomType.id} value={roomType.name}>
                        {roomType.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    type="number"
                    size="small"
                    value={row.occupancy}
                    onChange={(event) => handleNumberFieldChange(row.id, 'occupancy', event.target.value)}
                    slotProps={{ htmlInput: { min: 0, 'aria-label': `Occupancy for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    type="number"
                    size="small"
                    value={row.tariff}
                    onChange={(event) => handleNumberFieldChange(row.id, 'tariff', event.target.value)}
                    slotProps={{ htmlInput: { min: 0, 'aria-label': `Tariff for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    type="number"
                    size="small"
                    value={row.noOfRooms}
                    onChange={(event) => handleNumberFieldChange(row.id, 'noOfRooms', event.target.value)}
                    slotProps={{ htmlInput: { min: 0, 'aria-label': `Number of rooms for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <Typography variant="bodyM">{formatAmount(computeRoomLineTotalInclGst(row, totalDaysForMath))}</Typography>
                </TableCell>
                <TableCell>
                  {!row.locked && (
                    <IconButton
                      aria-label={`Remove ${row.roomType || 'room'} line`}
                      size="small"
                      onClick={() => handleRemoveRoomLine(row.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button onClick={handleAddRoomLine} startIcon={<AddIcon />} sx={addButtonStyles}>
          Add Room Line
        </Button>
      </Paper>

      <Stack direction="row" sx={footerStyles}>
        <Typography variant="bodyM" sx={footerCellStyles('occupancy')}>
          Total Occupancy: {totalOccupancy}
        </Typography>
        <Typography variant="bodyM" sx={footerCellStyles('charges')}>
          Total Charges: {formatAmount(totalCharges)}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default AccommodationStep;
