import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { z } from 'zod';
import { CLIENT_CONTACT_ROLE_OPTIONS, ClientContactRole, type clientContactSchema } from '../../contract';
import { addButtonStyles, roleFieldStyles, rowStackStyles, rowStyles } from './client-contact-rows.styles';

export type ClientContactFormValue = z.infer<typeof clientContactSchema>;

// A row identified by a stable id (RHF's useFieldArray field.id in every
// current caller) — this component is otherwise fully decoupled from
// react-hook-form: it takes plain rows and change callbacks, not a
// Control/register pair, so it doesn't need to know which form it's in.
// That's what let STORY-017 reuse it for editing an existing Event's
// contacts without any react-hook-form generic-typing gymnastics.
export interface ClientContactRowValue extends ClientContactFormValue {
  id: string;
}

interface ClientContactRowsProps {
  rows: ClientContactRowValue[];
  onRowChange: (index: number, patch: Partial<ClientContactFormValue>) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

// useFieldArray's `field.id` (surfaced here as `row.id`, distinct from the
// row's array index) is what keeps row identity/order correct under rapid
// add/remove — keying by index instead would let React reuse a row's
// DOM/input state for the wrong row after a mid-list removal.
const ClientContactRows = ({ rows, onRowChange, onAddRow, onRemoveRow }: ClientContactRowsProps) => {
  return (
    <Stack sx={rowStackStyles}>
      <Typography variant="titleM" component="h2">
        Client contacts
      </Typography>
      {rows.map((row, index) => (
        <Stack key={row.id} direction="row" sx={rowStyles}>
          <TextField
            label="Name"
            fullWidth
            value={row.name}
            onChange={(event) => onRowChange(index, { name: event.target.value })}
          />
          <TextField
            label="Contact number"
            fullWidth
            value={row.contactNumber}
            onChange={(event) => onRowChange(index, { contactNumber: event.target.value })}
          />
          <FormControl sx={roleFieldStyles}>
            <InputLabel id={`contact-role-label-${row.id}`}>Role</InputLabel>
            {/* Select<ClientContactRole>, not TextField's select prop — the
                explicit generic types event.target.value as ClientContactRole
                natively, avoiding an `as` cast (typescript-rules rule 1). */}
            <Select<ClientContactRole>
              labelId={`contact-role-label-${row.id}`}
              label="Role"
              value={row.role}
              onChange={(event) => onRowChange(index, { role: event.target.value })}
            >
              {CLIENT_CONTACT_ROLE_OPTIONS.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {roleOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton aria-label={`Remove contact row ${index + 1}`} size="small" onClick={() => onRemoveRow(index)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button onClick={onAddRow} sx={addButtonStyles}>
        Add contact
      </Button>
    </Stack>
  );
};

export default ClientContactRows;
