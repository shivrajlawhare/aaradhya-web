import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ClientContactRows, { type ClientContactFormValue } from '../../components/ui/client-contact-rows';
import { ClientContactRole, EventStatus, type eventResultSchema } from '../../contract';
import { quotationPreviewPath } from '../../routes';
import GenerateQuotationPdfButton from './generate-quotation-pdf-button';
import { contactsReadOnlyStyles, sectionStyles, statusFieldStyles } from './overview-tab.styles';
import TotalCostSummaryPanel from './total-cost-summary-panel';

type PublicEvent = z.infer<typeof eventResultSchema>;

const STATUS_OPTIONS = Object.values(EventStatus);

interface OverviewTabProps {
  event: PublicEvent;
  // Only an Event Manager gets working controls here — status/contacts
  // PATCH is EventManager-only on the backend (STORY-014), so anyone else
  // would just get a 403; showing read-only content instead is more honest
  // than showing controls that can't work.
  canEdit: boolean;
  onEventChanged: () => void;
}

// Deliberately no status-based lock-out anywhere in this component — the
// story's own edge case requires Cancelled (and every other status) to stay
// fully editable, so nothing here branches on event.status to disable
// anything.
const OverviewTab = ({ event, canEdit, onEventChanged }: OverviewTabProps) => {
  const [statusError, setStatusError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<{ clientContacts: ClientContactFormValue[] }>({
    defaultValues: { clientContacts: event.clientContacts },
  });
  const { fields, append, remove, update } = useFieldArray({ control, name: 'clientContacts' });

  const updateStatusMutation = tsr.updateEvent.useMutation({
    onSuccess: () => {
      setStatusError(null);
      onEventChanged();
    },
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 400) {
        setStatusError(error.body.error.message);
        return;
      }
      setStatusError('Something went wrong. Please try again.');
    },
  });

  const updateContactsMutation = tsr.updateEvent.useMutation({
    onSuccess: (response) => {
      setContactsError(null);
      reset({ clientContacts: response.body.clientContacts });
      onEventChanged();
    },
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 400) {
        setContactsError(error.body.error.message);
        return;
      }
      setContactsError('Something went wrong. Please try again.');
    },
  });

  const handleStatusChange = (status: EventStatus) => {
    updateStatusMutation.mutate({ params: { id: event.id }, body: { status } });
  };

  const handleContactRowChange = (index: number, patch: Partial<ClientContactFormValue>) => {
    const row = fields[index];
    if (!row) {
      return;
    }
    update(index, { ...row, ...patch });
  };

  const handleAddContactRow = () => {
    append({ name: '', contactNumber: '', role: ClientContactRole.Custom });
  };

  // Same "at least one named row" gate STORY-015's create form uses — a row
  // left blank isn't sent (matching STORY-014's own reject-empty rule), so
  // saving with every row blank has nothing valid to submit.
  const canSaveContacts = fields.some((field) => field.name.trim().length > 0);

  const handleSaveContacts = handleSubmit((values) => {
    if (updateContactsMutation.isPending || !canSaveContacts) {
      return;
    }
    const clientContacts = values.clientContacts
      .filter((contact) => contact.name.trim().length > 0)
      .map((contact) => ({
        name: contact.name.trim(),
        contactNumber: contact.contactNumber.trim(),
        role: contact.role,
      }));

    setContactsError(null);
    updateContactsMutation.mutate({ params: { id: event.id }, body: { clientContacts } });
  });

  let contactsSection: ReactNode;
  if (canEdit) {
    contactsSection = (
      <>
        <ClientContactRows
          rows={fields}
          onRowChange={handleContactRowChange}
          onAddRow={handleAddContactRow}
          onRemoveRow={remove}
        />
        {contactsError && (
          <Alert severity="error">
            <Typography variant="bodyM">{contactsError}</Typography>
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleSaveContacts}
          disabled={!canSaveContacts || updateContactsMutation.isPending}
        >
          Save contacts
        </Button>
      </>
    );
  } else {
    contactsSection = (
      <Stack sx={contactsReadOnlyStyles}>
        <Typography variant="titleM" component="h2">
          Client contacts
        </Typography>
        {event.clientContacts.map((contact, index) => (
          <Typography key={index} variant="bodyM">
            {contact.name} — {contact.contactNumber} ({contact.role})
          </Typography>
        ))}
      </Stack>
    );
  }

  return (
    <Stack sx={sectionStyles}>
      {canEdit && (
        <FormControl sx={statusFieldStyles}>
          <InputLabel id="event-status-label">Status</InputLabel>
          {/* Select<EventStatus>, not TextField's select prop — types
              event.target.value as EventStatus natively, no `as` cast. */}
          <Select<EventStatus>
            labelId="event-status-label"
            label="Status"
            value={event.status}
            disabled={updateStatusMutation.isPending}
            onChange={(changeEvent) => handleStatusChange(changeEvent.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {statusError && (
        <Alert severity="error">
          <Typography variant="bodyM">{statusError}</Typography>
        </Alert>
      )}
      {contactsSection}
      <TotalCostSummaryPanel event={event} canEdit={canEdit} onEventChanged={onEventChanged} />
      {/* Visible only on the Event Manager's view (this story's own AC) —
          STORY-052 will later re-check the Overview tab's own visibility
          per role; nothing here needs to change for that, since this
          button's visibility is entirely inherited from canEdit. */}
      {canEdit && <GenerateQuotationPdfButton event={event} />}
      {/* STORY-045's entry point into the Quotation Preview screen — no
          later story adds one, so this story has to. Placed next to the
          PDF button since the Flow is "before generating the PDF... open
          an in-app preview"; EventManager-gated for the same reason as the
          PDF button above it. */}
      {canEdit && (
        <Link component={RouterLink} to={quotationPreviewPath(event.id)}>
          Preview Quotation
        </Link>
      )}
    </Stack>
  );
};

export default OverviewTab;
