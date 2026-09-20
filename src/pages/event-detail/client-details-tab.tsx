import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alert, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import ClientContactRows, { type ClientContactFormValue } from '../../components/ui/client-contact-rows';
import { ClientContactRole, EventStatus, type filteredEventResultSchema } from '../../contract';
import { cardStyles, contactsReadOnlyStyles, sectionStyles, statusFieldStyles } from './client-details-tab.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;

const STATUS_OPTIONS = Object.values(EventStatus);

interface ClientDetailsTabProps {
  event: PublicEvent;
  // Only an Event Manager gets working controls here — status/contacts
  // PATCH is EventManager-only on the backend (STORY-014), so anyone else
  // would just get a 403; showing read-only content instead is more honest
  // than showing controls that can't work.
  canEdit: boolean;
  // Client Contacts visibility (STORY-046/STORY-052) — F&B Head/Reception
  // see it, Housekeeping doesn't. An explicit flag from the parent, not
  // re-derived here from `event.clientContacts` alone, matching
  // event-detail-page.tsx's own Payments/Rooms gates (a role flag paired
  // with a field-presence check, not data-presence alone).
  canSeeClientContacts: boolean;
  onEventChanged: () => void;
}

// STORY-077 — extracted verbatim from the old OverviewTab (STORY-076's own
// shell placeholder for this tab), minus the Total Cost Summary panel and
// PDF/Preview Quotation links, which moved to review-tab.tsx instead. No
// behavior change from what OverviewTab already did for these two sections.
//
// Deliberately no status-based lock-out anywhere in this component — the
// story's own edge case requires Cancelled (and every other status) to stay
// fully editable, so nothing here branches on event.status to disable
// anything.
const ClientDetailsTab = ({ event, canEdit, canSeeClientContacts, onEventChanged }: ClientDetailsTabProps) => {
  const [statusError, setStatusError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // `?? []` — this form is only ever submitted from the `canEdit` branch
  // below (Event Manager, whose clientContacts is always present,
  // unfiltered); a role for whom the field is genuinely absent (STORY-052)
  // never reaches the editable UI at all, so an empty starting array here
  // is purely to satisfy the now-`.optional()` type, not a real state this
  // form is ever used from.
  const { control, handleSubmit, reset, watch, setValue } = useForm<{ clientContacts: ClientContactFormValue[] }>({
    defaultValues: { clientContacts: event.clientContacts ?? [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'clientContacts' });

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

  // Not useFieldArray's own `update(index, ...)` — STORY-057's own root-cause
  // fix: `update()` unregisters and re-registers the row, handing back a
  // brand-new `field.id` on every call. ClientContactRows keys each row by
  // that id, so every keystroke was changing the row's own React key and
  // remounting its TextField — which is what actually lost focus, not
  // anything about the TextField itself. `setValue` on the nested path
  // changes the value React Hook Form holds without touching `field.id` at
  // all.
  const handleContactRowChange = (index: number, patch: Partial<ClientContactFormValue>) => {
    for (const [key, value] of Object.entries(patch) as [keyof ClientContactFormValue, string][]) {
      setValue(`clientContacts.${index}.${key}`, value);
    }
  };

  const handleAddContactRow = () => {
    append({ name: '', contactNumber: '', role: ClientContactRole.Custom });
  };

  const watchedClientContacts = watch('clientContacts');
  // `field.id` (stable, untouched by setValue above) paired with the live
  // watched value (reactive on every keystroke) — `fields` alone would show
  // stale text, since useFieldArray's own `fields` array doesn't pick up
  // setValue on a nested path the way `watch` does.
  const contactRows = fields.map((field, index) => ({
    ...(watchedClientContacts[index] ?? field),
    id: field.id,
  }));

  // Same "at least one named row" gate STORY-015's create form uses — a row
  // left blank isn't sent (matching STORY-014's own reject-empty rule), so
  // saving with every row blank has nothing valid to submit. Reads the
  // watched value, not `fields` — `fields` doesn't reflect the `setValue`
  // calls above, so it would never re-enable as the operator types.
  const canSaveContacts = watchedClientContacts.some((contact) => contact.name.trim().length > 0);

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

  // Three-way, not two: editable (Event Manager), read-only (a role
  // STORY-046 grants clientContacts to — F&B Head, Reception), or nothing
  // at all (Housekeeping, for whom this key is genuinely absent from the
  // response — SRS §3.3 never lists client names among what it sees). The
  // `else if` branch is the only one that reads `event.clientContacts`
  // directly, so it's the only place that needs it narrowed away from
  // `undefined`.
  let contactsSection: ReactNode = null;
  if (canEdit) {
    contactsSection = (
      <>
        <ClientContactRows
          rows={contactRows}
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
  } else if (canSeeClientContacts && event.clientContacts) {
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
        <Paper elevation={0} sx={cardStyles}>
          <Typography variant="titleM" component="h2">
            Event Status
          </Typography>
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
          {statusError && (
            <Alert severity="error">
              <Typography variant="bodyM">{statusError}</Typography>
            </Alert>
          )}
        </Paper>
      )}
      {contactsSection && (
        <Paper elevation={0} sx={cardStyles}>
          {contactsSection}
        </Paper>
      )}
    </Stack>
  );
};

export default ClientDetailsTab;
