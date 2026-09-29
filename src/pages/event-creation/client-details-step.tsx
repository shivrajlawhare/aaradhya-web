import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { ILLUSTRATIONS } from '../../components/ui/illustrations';
import ThemedImage from '../../components/ui/themed-image';
import { useEventWizard } from '../../stores/event-wizard-context';
import {
  addButtonStyles,
  cardStyles,
  customRowHeaderStyles,
  helperArtStyles,
  helperItemStyles,
  helperListStyles,
  helperStyles,
  layoutStyles,
  removeButtonStyles,
  roleLabelStyles,
  rowStackStyles,
  rowStyles,
} from './client-details-step.styles';
import StepLabel from './step-label';
import { markerStyles } from './wizard-stepper.styles';
import { WIZARD_STEPS } from './wizard-steps';

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

// Figma's read-only "What's next" helper (desktop only): the five steps,
// Client Details current. Each label reads "1. Client Details" to assistive
// tech, the same way the stepper does, with the number shown in the marker.
const WhatsNextHelper = () => (
  <Box component="aside" aria-label="What's next" sx={helperStyles}>
    <ThemedImage {...ILLUSTRATIONS.users} sx={helperArtStyles} />
    <Typography variant="h3" component="h2">
      What&apos;s next
    </Typography>
    <Box component="ol" sx={helperListStyles}>
      {WIZARD_STEPS.map((step, index) => {
        const status = index === 0 ? 'current' : 'upcoming';
        return (
          <Box component="li" key={step.id} sx={helperItemStyles}>
            <Box aria-hidden sx={markerStyles(status)}>
              {index + 1}
            </Box>
            <StepLabel number={index + 1} label={step.label} status={status} />
          </Box>
        );
      })}
    </Box>
  </Box>
);

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
    <Box sx={layoutStyles}>
      <Paper elevation={0} sx={cardStyles}>
        <Typography variant="h3" component="h2">
          Client Details
        </Typography>
        <Stack sx={rowStackStyles}>
          {rows.map((row, index) => (
            <Box key={row.id} sx={rowStyles}>
              {row.isDefault && (
                <Typography component="p" sx={roleLabelStyles}>
                  {row.roleLabel}
                </Typography>
              )}
              {!row.isDefault && (
                <>
                  <Typography variant="labelS" component="p" sx={customRowHeaderStyles}>
                    Additional contact
                  </Typography>
                  <TextField
                    label="Role"
                    value={row.roleLabel}
                    onChange={(event) => handleFieldChange(row.id, { roleLabel: event.target.value })}
                  />
                </>
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
                  sx={removeButtonStyles}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Button variant="tonal" onClick={handleAddRow} startIcon={<AddIcon />} sx={addButtonStyles}>
            Add Contact
          </Button>
        </Stack>
      </Paper>
      <WhatsNextHelper />
    </Box>
  );
};

export default ClientDetailsStep;
