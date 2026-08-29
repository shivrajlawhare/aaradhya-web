import type { FieldArrayWithId, UseFormRegister } from 'react-hook-form';
import { Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { z } from 'zod';
import type { roomLineSchema } from '../../contract';
import type { AccommodationFormValues } from './rooms-tab';
import { addButtonStyles, numericCellStyles, tableCardStyles } from './room-line-rows.styles';

type RoomLineResult = z.infer<typeof roomLineSchema> & { totalInclGst: number };

interface RoomLineRowsProps {
  fields: FieldArrayWithId<AccommodationFormValues, 'roomLines', 'id'>[];
  // The last-saved server response's room lines, purely for the read-only
  // Total column — matched by index. A row added locally but not yet saved
  // has no entry here (this component never computes a total itself).
  savedRoomLines: RoomLineResult[];
  register: UseFormRegister<AccommodationFormValues>;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

// field.id (RHF's own generated key, distinct from array index) keeps row
// identity/order correct under rapid add/remove — same reasoning as
// ClientContactRows (STORY-015).
const RoomLineRows = ({ fields, savedRoomLines, register, onAddRow, onRemoveRow }: RoomLineRowsProps) => {
  return (
    <Paper sx={tableCardStyles}>
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
          {fields.map((field, index) => {
            const savedTotal = savedRoomLines[index]?.totalInclGst;
            const totalDisplay = savedTotal === undefined ? '—' : savedTotal;
            return (
              <TableRow key={field.id}>
                <TableCell>
                  <TextField
                    {...register(`roomLines.${index}.roomType`)}
                    size="small"
                    slotProps={{ htmlInput: { 'aria-label': `Room type for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    {...register(`roomLines.${index}.occupancy`, { valueAsNumber: true })}
                    type="number"
                    size="small"
                    slotProps={{ htmlInput: { min: 0, 'aria-label': `Occupancy for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    {...register(`roomLines.${index}.tariff`, { valueAsNumber: true })}
                    type="number"
                    size="small"
                    slotProps={{ htmlInput: { min: 0, 'aria-label': `Tariff for room line ${index + 1}` } }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <TextField
                    {...register(`roomLines.${index}.noOfRooms`, { valueAsNumber: true })}
                    type="number"
                    size="small"
                    slotProps={{
                      htmlInput: { min: 0, 'aria-label': `Number of rooms for room line ${index + 1}` },
                    }}
                  />
                </TableCell>
                <TableCell sx={numericCellStyles}>
                  <Typography variant="bodyM">{totalDisplay}</Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label={`Remove room line ${index + 1}`}
                    size="small"
                    onClick={() => onRemoveRow(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Button onClick={onAddRow} sx={addButtonStyles}>
        Add room line
      </Button>
    </Paper>
  );
};

export default RoomLineRows;
