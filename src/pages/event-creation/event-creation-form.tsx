import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import ClientContactRows, { type ClientContactFormValue } from '../../components/ui/client-contact-rows';
import { ClientContactRole, Role } from '../../contract';
import { eventDetailPath } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { fieldStackStyles, formStyles } from './event-creation-form.styles';

export const FAMILY_TYPE_PRESETS = ['Wedding', 'Corporate', 'Birthday', 'Other'];
// A distinct sentinel from 'Other' — SRS §5.1 lists Wedding/Corporate/
// Birthday/Other as the fixed presets; this story's own AC additionally asks
// for a "Custom…" option that reveals a free-text field, so both exist:
// 'Other' submits literally as 'Other', 'Custom…' submits whatever the
// caller types.
export const CUSTOM_FAMILY_TYPE_OPTION = 'Custom…';

export interface EventCreationFormValues {
  eventFamilyTypeOption: string;
  eventFamilyTypeCustom: string;
  eventManager: string;
  clientContacts: ClientContactFormValue[];
}

const defaultClientContacts: ClientContactFormValue[] = [
  { name: '', contactNumber: '', role: ClientContactRole.Bride },
  { name: '', contactNumber: '', role: ClientContactRole.Groom },
  { name: '', contactNumber: '', role: ClientContactRole.POC },
];

const EventCreationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Only active EventManager accounts are offered — the backend itself
  // allows assigning an inactive one (STORY-012's own deliberate choice, for
  // Events that already reference one), but that's about not breaking
  // existing data, not about this form steering a new Event onto one.
  const usersQuery = tsr.listUsers.useQuery({ queryKey: ['users'] });
  const eventManagerOptions = (usersQuery.data?.body ?? []).filter(
    (account) => account.role === Role.EventManager && account.active,
  );

  const { control, register, handleSubmit, watch } = useForm<EventCreationFormValues>({
    defaultValues: {
      eventFamilyTypeOption: FAMILY_TYPE_PRESETS[0],
      eventFamilyTypeCustom: '',
      // Defaults to the caller's own account — Flow: "assigns themself or
      // another manager" names self-assignment as the common case; the
      // picker (ClientContactRows' sibling select, rendered below) still
      // lets it be changed to any other Event Manager.
      eventManager: user?.id ?? '',
      clientContacts: defaultClientContacts,
    },
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: 'clientContacts' });
  const handleContactRowChange = (index: number, patch: Partial<ClientContactFormValue>) => {
    const row = fields[index];
    if (!row) {
      return;
    }
    update(index, { ...row, ...patch });
  };
  const handleAddContactRow = () => {
    // A row added beyond the three defaults (Bride/Groom/POC) has no
    // obvious role to start on, so it starts as Custom — freely changeable
    // via the row's own Select either way.
    append({ name: '', contactNumber: '', role: ClientContactRole.Custom });
  };

  const clientContacts = watch('clientContacts');
  const eventFamilyTypeOption = watch('eventFamilyTypeOption');
  // Only this gate disables submit — the story's AC names it explicitly.
  // eventFamilyType/eventManager being empty isn't blocked here; an empty
  // one just 400s and surfaces inline, same as any other bad value (this
  // story's own AC bullet 4 exists precisely for that path).
  const canSubmit = clientContacts.some((contact) => contact.name.trim().length > 0);

  const createEventMutation = tsr.createEvent.useMutation({
    onSuccess: (response) => {
      navigate(eventDetailPath(response.body.id));
    },
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 400) {
        setSubmitError(error.body.error.message);
        return;
      }
      setSubmitError('Something went wrong. Please try again.');
    },
  });

  const handleCreate = (values: EventCreationFormValues) => {
    const hasNamedContact = values.clientContacts.some((contact) => contact.name.trim().length > 0);
    if (createEventMutation.isPending || !hasNamedContact) {
      return;
    }

    const eventFamilyType =
      values.eventFamilyTypeOption === CUSTOM_FAMILY_TYPE_OPTION
        ? values.eventFamilyTypeCustom.trim()
        : values.eventFamilyTypeOption;

    // A row left untouched (still blank) isn't sent — the backend requires
    // every submitted row to carry a name, so a blank default row (e.g. an
    // unused POC placeholder) would otherwise 400 the whole request.
    const clientContactsPayload = values.clientContacts
      .filter((contact) => contact.name.trim().length > 0)
      .map((contact) => ({
        name: contact.name.trim(),
        contactNumber: contact.contactNumber.trim(),
        role: contact.role,
      }));

    setSubmitError(null);
    createEventMutation.mutate({
      body: {
        eventFamilyType,
        eventManager: values.eventManager,
        clientContacts: clientContactsPayload,
      },
    });
  };

  return (
    <Paper component="form" onSubmit={handleSubmit(handleCreate)} noValidate sx={formStyles}>
      <Stack sx={fieldStackStyles}>
        <Typography variant="titleL" component="h1">
          New Event
        </Typography>
        <TextField {...register('eventFamilyTypeOption')} select label="Family type" fullWidth>
          {FAMILY_TYPE_PRESETS.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {preset}
            </MenuItem>
          ))}
          <MenuItem value={CUSTOM_FAMILY_TYPE_OPTION}>{CUSTOM_FAMILY_TYPE_OPTION}</MenuItem>
        </TextField>
        {eventFamilyTypeOption === CUSTOM_FAMILY_TYPE_OPTION && (
          <TextField {...register('eventFamilyTypeCustom')} label="Custom family type" fullWidth />
        )}
        {/* Controller, not register — eventManagerOptions loads
            asynchronously (GET /users), so the default value (self) needs to
            stay bound live and re-render once the matching MenuItem actually
            exists; register's uncontrolled ref-set-on-mount would silently
            drop a default that has no option to attach to yet. */}
        <Controller
          name="eventManager"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Event manager" fullWidth>
              {eventManagerOptions.map((account) => {
                const label = account.id === user?.id ? `${account.name} (you)` : account.name;
                return (
                  <MenuItem key={account.id} value={account.id}>
                    {label}
                  </MenuItem>
                );
              })}
            </TextField>
          )}
        />
        <ClientContactRows
          rows={fields}
          onRowChange={handleContactRowChange}
          onAddRow={handleAddContactRow}
          onRemoveRow={remove}
        />
        {submitError && (
          <Alert severity="error">
            <Typography variant="bodyM">{submitError}</Typography>
          </Alert>
        )}
        <Button type="submit" variant="contained" disabled={!canSubmit || createEventMutation.isPending}>
          Create event
        </Button>
      </Stack>
    </Paper>
  );
};

export default EventCreationForm;
