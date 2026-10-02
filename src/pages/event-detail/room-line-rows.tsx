import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { FieldArrayWithId, UseFormRegister } from 'react-hook-form';
import type { z } from 'zod';
import type { roomLineSchema } from '../../contract';
import {
  addButtonStyles,
  amountCellStyles,
  mobileLineStyles,
  mobileNumbersStyles,
  mobileTotalStyles,
  numericFieldStyles,
  removeCellStyles,
  roomTypeFieldStyles,
  tableCardStyles,
  tableScrollStyles,
} from './room-line-rows.styles';
import type { AccommodationFormValues } from './rooms-tab';

type RoomLineResult = z.infer<typeof roomLineSchema> & { totalTaxable: number };

interface FieldLabels {
  roomType?: string;
  tariff?: string;
  rooms?: string;
}

// Mobile blocks label each field; the desktop table's header does instead.
const MOBILE_FIELD_LABELS: FieldLabels = { roomType: 'Room type', tariff: 'Tariff', rooms: 'Rooms' };
const TABLE_FIELD_LABELS: FieldLabels = {};

interface RoomLineRowsProps {
  fields: FieldArrayWithId<AccommodationFormValues, 'roomLines', 'id'>[];
  // The last-saved server response's room lines, purely for the read-only
  // Total column — matched by index. A row added locally but not yet saved
  // has no entry here (this component never computes a total itself).
  savedRoomLines: RoomLineResult[];
  // Each row's read-only occupancy (DEV-07: never typed — it comes from the
  // Room Type master, and the server snapshots it on save); null when the
  // typed room type matches no master entry.
  occupancies: (number | null)[];
  register: UseFormRegister<AccommodationFormValues>;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

// The Accommodation tab's room lines (Figma 07 Event Detail / Accommodation):
// a table on desktop, a stacked block per line on mobile. field.id (RHF's
// own key, distinct from the index) keeps row identity correct under rapid
// add/remove — same reasoning as ClientContactRows (STORY-015).
const RoomLineRows = ({ fields, savedRoomLines, occupancies, register, onAddRow, onRemoveRow }: RoomLineRowsProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const labels = isDesktop ? TABLE_FIELD_LABELS : MOBILE_FIELD_LABELS;

  const roomTypeField = (index: number) => (
    <TextField
      {...register(`roomLines.${index}.roomType`)}
      size="small"
      fullWidth
      label={labels.roomType}
      sx={roomTypeFieldStyles}
      slotProps={{ htmlInput: { 'aria-label': `Room type for room line ${index + 1}` } }}
    />
  );
  const tariffField = (index: number) => (
    <TextField
      {...register(`roomLines.${index}.tariff`, { valueAsNumber: true })}
      type="number"
      size="small"
      label={labels.tariff}
      sx={numericFieldStyles}
      slotProps={{ htmlInput: { min: 0, 'aria-label': `Tariff for room line ${index + 1}` } }}
    />
  );
  const roomsField = (index: number) => (
    <TextField
      {...register(`roomLines.${index}.noOfRooms`, { valueAsNumber: true })}
      type="number"
      size="small"
      label={labels.rooms}
      sx={numericFieldStyles}
      slotProps={{ htmlInput: { min: 0, 'aria-label': `Number of rooms for room line ${index + 1}` } }}
    />
  );
  const removeButton = (index: number) => (
    <IconButton aria-label={`Remove room line ${index + 1}`} size="small" onClick={() => onRemoveRow(index)}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );
  const totalOf = (index: number) => savedRoomLines[index]?.totalTaxable ?? '—';
  const addButton = (
    <Button variant="ghost" startIcon={<AddIcon />} onClick={onAddRow} sx={addButtonStyles}>
      Add room line
    </Button>
  );

  if (!isDesktop) {
    return (
      <Paper elevation={0} sx={tableCardStyles}>
        {fields.map((field, index) => (
          <Box key={field.id} role="group" aria-label={`Room line ${index + 1}`} sx={mobileLineStyles}>
            {roomTypeField(index)}
            <Box sx={mobileNumbersStyles}>
              <Box>
                <Typography variant="labelM" component="p">
                  Occupancy
                </Typography>
                <Typography variant="bodyM">{occupancies[index] ?? '—'}</Typography>
              </Box>
              {tariffField(index)}
              {roomsField(index)}
            </Box>
            <Box sx={mobileTotalStyles}>
              <Typography variant="bodyS">Total Taxable Amount</Typography>
              <Typography variant="numeric">{totalOf(index)}</Typography>
              {removeButton(index)}
            </Box>
          </Box>
        ))}
        {addButton}
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={tableCardStyles}>
      <Box sx={tableScrollStyles}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Room type</TableCell>
              <TableCell align="right">Occupancy</TableCell>
              <TableCell>Tariff</TableCell>
              <TableCell>Rooms</TableCell>
              <TableCell align="right">Total Taxable Amount</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>{roomTypeField(index)}</TableCell>
                <TableCell align="right" sx={amountCellStyles}>
                  <Typography variant="numeric">{occupancies[index] ?? '—'}</Typography>
                </TableCell>
                <TableCell>{tariffField(index)}</TableCell>
                <TableCell>{roomsField(index)}</TableCell>
                <TableCell align="right" sx={amountCellStyles}>
                  <Typography variant="numeric">{totalOf(index)}</Typography>
                </TableCell>
                <TableCell sx={removeCellStyles}>{removeButton(index)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {addButton}
    </Paper>
  );
};

export default RoomLineRows;
