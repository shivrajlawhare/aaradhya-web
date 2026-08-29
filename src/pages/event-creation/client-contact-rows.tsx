import { Controller, useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CLIENT_CONTACT_ROLE_OPTIONS, ClientContactRole } from '../../contract';
import type { EventCreationFormValues } from './event-creation-form';
import { addButtonStyles, rowStackStyles, rowStyles } from './client-contact-rows.styles';

interface ClientContactRowsProps {
  control: Control<EventCreationFormValues>;
  register: UseFormRegister<EventCreationFormValues>;
}

// A row that's added beyond the three defaults (Bride/Groom/POC) has no
// obvious role to start on, so it starts as Custom — freely changeable via
// each row's own Select either way.
const NEW_ROW_DEFAULT: EventCreationFormValues['clientContacts'][number] = {
  name: '',
  contactNumber: '',
  role: ClientContactRole.Custom,
};

// useFieldArray's `field.id` (a stable key RHF generates per row, distinct
// from the row's array index) is what keeps row identity/order correct
// under rapid add/remove — keying by index instead would let React reuse a
// row's DOM/input state for the wrong row after a mid-list removal.
const ClientContactRows = ({ control, register }: ClientContactRowsProps) => {
  const { fields, append, remove } = useFieldArray({ control, name: 'clientContacts' });

  const handleAddRow = () => {
    append(NEW_ROW_DEFAULT);
  };

  return (
    <Stack sx={rowStackStyles}>
      <Typography variant="titleM" component="h2">
        Client contacts
      </Typography>
      {fields.map((field, index) => (
        <Stack key={field.id} direction="row" sx={rowStyles}>
          <TextField label="Name" fullWidth {...register(`clientContacts.${index}.name`)} />
          <TextField
            label="Contact number"
            fullWidth
            {...register(`clientContacts.${index}.contactNumber`)}
          />
          <Controller
            name={`clientContacts.${index}.role`}
            control={control}
            render={({ field: roleField }) => (
              <TextField {...roleField} select label="Role">
                {CLIENT_CONTACT_ROLE_OPTIONS.map((roleOption) => (
                  <MenuItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <IconButton
            aria-label={`Remove contact row ${index + 1}`}
            size="small"
            onClick={() => remove(index)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button onClick={handleAddRow} sx={addButtonStyles}>
        Add contact
      </Button>
    </Stack>
  );
};

export default ClientContactRows;
