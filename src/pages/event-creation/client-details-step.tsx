import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEventWizard } from '../../stores/event-wizard-context';
import {
  addButtonStyles,
  cardStyles,
  roleFieldStyles,
  roleLabelStyles,
  rowStackStyles,
  rowStyles,
} from './client-details-step.styles';

// A row held in the wizard store — deliberately not aaradhya-web's own
// clientContactSchema/ClientContactRole (contract/index.ts): that shape's
// `role` is a closed 4-value enum with nowhere to hold a custom row's own
// free-text label, but this story's own AC asks for exactly that ("an
// editable role-label field (free text, not restricted to the three
// defaults)"). Nothing here is submitted to the backend yet (SRS FR-EVT-8 —
// held in the wizard store until Step 5) — reconciling this shape with
// whatever POST /events actually accepts is STORY-068's own job, not this
// step's.
export interface WizardContactRow {
  id: string;
  roleLabel: string;
  isDefault: boolean;
  name: string;
  contactNumber: string;
}

// FR-EVT-2's "default rows Bride, Groom, POC" — always present, pre-labeled,
// no remove affordance. Fixed ids (not generated) since there are always
// exactly these three slots.
export const DEFAULT_CONTACT_ROWS: WizardContactRow[] = [
  { id: 'bride', roleLabel: 'Bride', isDefault: true, name: '', contactNumber: '' },
  { id: 'groom', roleLabel: 'Groom', isDefault: true, name: '', contactNumber: '' },
  { id: 'poc', roleLabel: 'Point of Contact', isDefault: true, name: '', contactNumber: '' },
];

// Time+random, not a module-level counter — a counter would risk colliding
// with an added row's id already sitting in sessionStorage from before a
// reload reset it back to 0.
const createRowId = (): string => `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface ClientDetailsStepData {
  contacts: WizardContactRow[];
}

const isClientDetailsStepData = (value: unknown): value is ClientDetailsStepData =>
  typeof value === 'object' && value !== null && Array.isArray((value as ClientDetailsStepData).contacts);

// Wizard Step 1 (STORY-064). No react-hook-form here, unlike the old
// single-page form's ClientContactRows — there's nothing to validate or
// submit at this step (every field is optional, "Next" always enables), so
// plain local state mirrored into the wizard store on every change is
// simpler than wiring a form around fields with no validation rules.
const ClientDetailsStep = () => {
  const { data, setStepData } = useEventWizard();
  const stored = data['client-details'];

  const [rows, setRows] = useState<WizardContactRow[]>(() =>
    isClientDetailsStepData(stored) ? stored.contacts : DEFAULT_CONTACT_ROWS
  );

  // Mirrors every change (including the very first render's defaults) into
  // the wizard store — this is what lets Step 2's Back, or a reload, come
  // back to exactly these rows (STORY-063's own sessionStorage contract).
  useEffect(() => {
    setStepData('client-details', { contacts: rows });
  }, [rows, setStepData]);

  const handleFieldChange = (
    id: string,
    patch: Partial<Pick<WizardContactRow, 'name' | 'contactNumber' | 'roleLabel'>>
  ) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleAddRow = () => {
    setRows((current) => [
      ...current,
      { id: createRowId(), roleLabel: '', isDefault: false, name: '', contactNumber: '' },
    ]);
  };

  // Filters the row out of state entirely, not just a `removed` flag — this
  // story's own edge case: a removed row's data must actually be gone from
  // the wizard store, not merely hidden, so it can never reappear on Step 5.
  const handleRemoveRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <Paper elevation={0} sx={cardStyles}>
      <Typography variant="titleM" component="h2">
        Client Details
      </Typography>
      <Stack sx={rowStackStyles}>
        {rows.map((row, index) => (
          <Stack key={row.id} direction="row" sx={rowStyles}>
            {row.isDefault ? (
              <Typography variant="bodyM" sx={roleLabelStyles}>
                {row.roleLabel}
              </Typography>
            ) : (
              <TextField
                label="Role"
                value={row.roleLabel}
                onChange={(event) => handleFieldChange(row.id, { roleLabel: event.target.value })}
                sx={roleFieldStyles}
              />
            )}
            <TextField
              label="Name"
              fullWidth
              value={row.name}
              onChange={(event) => handleFieldChange(row.id, { name: event.target.value })}
            />
            <TextField
              label="Contact Number"
              fullWidth
              value={row.contactNumber}
              onChange={(event) => handleFieldChange(row.id, { contactNumber: event.target.value })}
            />
            {!row.isDefault && (
              <IconButton
                aria-label={`Remove contact row ${index + 1}`}
                size="small"
                onClick={() => handleRemoveRow(row.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}
        <Button onClick={handleAddRow} startIcon={<AddIcon />} sx={addButtonStyles}>
          Add Contact
        </Button>
      </Stack>
    </Paper>
  );
};

export default ClientDetailsStep;
