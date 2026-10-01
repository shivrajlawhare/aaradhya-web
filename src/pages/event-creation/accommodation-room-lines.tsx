import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { computeRoomLineTaxable } from '../../utils/accommodation-calculations';
import { formatRupees } from '../event-detail/format-amount';
import {
  amountCellStyles,
  cardAmountRowStyles,
  cardFieldRowStyles,
  cardHeaderStyles,
  cardStyles,
  cardTypeFieldStyles,
  numberFieldStyles,
  removeCellStyles,
  roomTypeFieldStyles,
  secondaryTextStyles,
  tableScrollStyles,
  tariffFieldStyles,
} from './accommodation-room-lines.styles';

export interface WizardRoomLine {
  id: string;
  // Field names match roomLineSchema (contract/index.ts) one-for-one, ready
  // for review-step.tsx's submit mapping.
  roomType: string;
  // A copy of the selected Room Type's master occupancy — shown read-only,
  // never typed (DEV-07); the server snapshots it again on save.
  occupancy: number;
  tariff: number;
  noOfRooms: number;
  // The Extra Beds default row can't be removed.
  locked: boolean;
}

export type RoomLineNumberField = 'tariff' | 'noOfRooms';

interface RoomTypeOption {
  id: string;
  name: string;
}

interface AccommodationRoomLinesProps {
  rows: WizardRoomLine[];
  roomTypeOptions: RoomTypeOption[];
  totalNights: number;
  isDesktop: boolean;
  onRoomTypeChange: (id: string, roomTypeName: string) => void;
  onNumberChange: (id: string, field: RoomLineNumberField, rawValue: string) => void;
  onRemove: (id: string) => void;
}

interface RoomLineFieldProps {
  row: WizardRoomLine;
  lineNumber: number;
  roomTypeOptions: RoomTypeOption[];
  onRoomTypeChange: AccommodationRoomLinesProps['onRoomTypeChange'];
  onNumberChange: AccommodationRoomLinesProps['onNumberChange'];
}

const RoomTypeField = ({ row, lineNumber, roomTypeOptions, onRoomTypeChange }: RoomLineFieldProps) => (
  <TextField
    select
    size="small"
    fullWidth
    value={row.roomType}
    onChange={(event) => onRoomTypeChange(row.id, event.target.value)}
    slotProps={{ htmlInput: { 'aria-label': `Room type for room line ${lineNumber}` } }}
  >
    <MenuItem value="">Select a room type</MenuItem>
    {roomTypeOptions.map((roomType) => (
      <MenuItem key={roomType.id} value={roomType.name}>
        {roomType.name}
      </MenuItem>
    ))}
  </TextField>
);

const TariffField = ({ row, lineNumber, onNumberChange }: RoomLineFieldProps) => (
  <TextField
    type="number"
    size="small"
    fullWidth
    value={row.tariff}
    onChange={(event) => onNumberChange(row.id, 'tariff', event.target.value)}
    sx={tariffFieldStyles}
    slotProps={{
      htmlInput: { min: 0, 'aria-label': `Tariff for room line ${lineNumber}` },
      input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
    }}
  />
);

const RoomsField = ({ row, lineNumber, onNumberChange }: RoomLineFieldProps) => (
  <TextField
    type="number"
    size="small"
    fullWidth
    value={row.noOfRooms}
    onChange={(event) => onNumberChange(row.id, 'noOfRooms', event.target.value)}
    slotProps={{ htmlInput: { min: 0, 'aria-label': `Number of rooms for room line ${lineNumber}` } }}
  />
);

interface RemoveButtonProps {
  row: WizardRoomLine;
  onRemove: (id: string) => void;
}

const RemoveButton = ({ row, onRemove }: RemoveButtonProps) => {
  if (row.locked) {
    return null;
  }
  return (
    <IconButton aria-label={`Remove ${row.roomType || 'room'} line`} size="small" onClick={() => onRemove(row.id)}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};

// Wizard step 3's Room Lines (Figma 05 New Event / 3 Accommodation): a
// table on desktop, one card per line on mobile. Occupancy is read-only.
const AccommodationRoomLines = ({
  rows,
  roomTypeOptions,
  totalNights,
  isDesktop,
  onRoomTypeChange,
  onNumberChange,
  onRemove,
}: AccommodationRoomLinesProps) => {
  const fieldProps = (row: WizardRoomLine, index: number): RoomLineFieldProps => ({
    row,
    lineNumber: index + 1,
    roomTypeOptions,
    onRoomTypeChange,
    onNumberChange,
  });

  if (!isDesktop) {
    return (
      <>
        {rows.map((row, index) => (
          <Paper key={row.id} elevation={0} sx={cardStyles} aria-label={`Room line ${index + 1}`} role="group">
            <Typography variant="labelM" component="p" sx={secondaryTextStyles}>
              Room type
            </Typography>
            <Box sx={cardHeaderStyles}>
              <Box sx={cardTypeFieldStyles}>
                <RoomTypeField {...fieldProps(row, index)} />
              </Box>
              <RemoveButton row={row} onRemove={onRemove} />
            </Box>
            <Typography variant="bodyM" sx={secondaryTextStyles}>
              Occ. {row.occupancy}
            </Typography>
            <Box sx={cardFieldRowStyles}>
              <Box>
                <Typography variant="labelM" component="p">
                  Tariff
                </Typography>
                <TariffField {...fieldProps(row, index)} />
              </Box>
              <Box>
                <Typography variant="labelM" component="p">
                  Rooms
                </Typography>
                <RoomsField {...fieldProps(row, index)} />
              </Box>
            </Box>
            <Box sx={cardAmountRowStyles}>
              <Typography variant="bodyS">Total Taxable Amount</Typography>
              <Typography variant="numeric">{formatRupees(computeRoomLineTaxable(row, totalNights))}</Typography>
            </Box>
          </Paper>
        ))}
      </>
    );
  }

  return (
    <Box sx={tableScrollStyles}>
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
            <TableCell align="right">
              <Typography variant="labelS">Total Taxable Amount</Typography>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell sx={roomTypeFieldStyles}>
                <RoomTypeField {...fieldProps(row, index)} />
              </TableCell>
              <TableCell>
                <Typography variant="bodyM">{row.occupancy}</Typography>
              </TableCell>
              <TableCell sx={numberFieldStyles}>
                <TariffField {...fieldProps(row, index)} />
              </TableCell>
              <TableCell sx={numberFieldStyles}>
                <RoomsField {...fieldProps(row, index)} />
              </TableCell>
              <TableCell align="right" sx={amountCellStyles}>
                <Typography variant="numeric">{formatRupees(computeRoomLineTaxable(row, totalNights))}</Typography>
              </TableCell>
              <TableCell sx={removeCellStyles}>
                <RemoveButton row={row} onRemove={onRemove} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AccommodationRoomLines;
