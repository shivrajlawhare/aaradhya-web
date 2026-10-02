import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  type Control,
  Controller,
  type FieldPath,
  useFieldArray,
  useForm,
  type UseFormRegister,
} from 'react-hook-form';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { useToast } from '../../components/ui/toast-provider';
import type { oneDayEventTemplateResultSchema, roomTypeResultSchema, venueResultSchema } from '../../contract';
import { EVENT_FAMILY_TYPE_PRESETS } from '../event-creation/event-family-type-options';
import { CEREMONY_EVENT_NAME_PRESETS, MEAL_NAME_PRESETS } from '../event-creation/sessions-items-forms';
import { formatAmount } from '../event-detail/format-amount';
import MenuItemSearch, { type MenuItemChip } from '../event-detail/menu-item-search';
import {
  EMPTY_CEREMONY,
  EMPTY_LINE_ITEM,
  EMPTY_MEAL,
  type OneDayEventFormValues,
  toOneDayEventFormValues,
  toOneDayEventTemplateBody,
} from './one-day-event-form';
import {
  addButtonStyles,
  cardStyles,
  ceremonyRowStyles,
  eventFieldsStyles,
  lineItemRowStyles,
  loadingStyles,
  mealFieldsStyles,
  mealPanelStyles,
  panelStyles,
  removeButtonStyles,
  roomsInputStyles,
  roomsTableWrapperStyles,
  saveHeaderStyles,
} from './one-day-event-settings.styles';

type OneDayEventTemplate = z.infer<typeof oneDayEventTemplateResultSchema>;
type VenueMasterEntry = z.infer<typeof venueResultSchema>;
type RoomTypeMasterEntry = z.infer<typeof roomTypeResultSchema>;

const SAVED_MESSAGE = 'One Day Event template saved.';
const SAVE_ERROR = 'The template couldn’t be saved. Please try again.';
const NEW_MENU_ITEM_ERROR = 'Something went wrong adding a new menu item. Please try again.';
const REQUIRED = { required: 'Required' };

const RUPEE_ADORNMENT = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };
const NUMBER_INPUT = { htmlInput: { min: 0 } };
const RUPEE_NUMBER_INPUT = { ...NUMBER_INPUT, ...RUPEE_ADORNMENT };
const PERCENT_INPUT = {
  htmlInput: { min: 0, max: 100 },
  input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
};

// Every distinct option, keeping the current value selectable even when it
// isn't (or no longer is) in the list.
const withCurrent = (options: string[], current: string): string[] =>
  current && !options.includes(current) ? [...options, current] : options;

interface TimeFieldProps {
  label: string;
  name: FieldPath<OneDayEventFormValues>;
  register: UseFormRegister<OneDayEventFormValues>;
  error?: string;
}

// A native 'HH:mm' time input — the template only stores times, so the
// wizard's large clock cards aren't needed here.
const TimeField = ({ label, name, register, error }: TimeFieldProps) => (
  <TextField label={label} type="time" error={Boolean(error)} helperText={error} {...register(name, REQUIRED)} />
);

interface NameAutocompleteProps {
  label: string;
  name: `ceremonies.${number}.eventName` | `meals.${number}.mealName`;
  presets: string[];
  control: Control<OneDayEventFormValues>;
}

// A preset name or any custom one (e.g. "Welcome Drink").
const NameAutocomplete = ({ label, name, presets, control }: NameAutocompleteProps) => (
  <Controller
    control={control}
    name={name}
    rules={REQUIRED}
    render={({ field, fieldState }) => (
      <Autocomplete
        freeSolo
        forcePopupIcon
        options={presets}
        value={field.value}
        onChange={(_event, value) => field.onChange(value ?? '')}
        onInputChange={(_event, value) => field.onChange(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
    )}
  />
);

interface SelectFieldProps {
  label: string;
  name: 'eventFamilyType' | 'sessionType';
  options: string[];
  control: Control<OneDayEventFormValues>;
}

const SelectField = ({ label, name, options, control }: SelectFieldProps) => (
  <Controller
    control={control}
    name={name}
    rules={REQUIRED}
    render={({ field, fieldState }) => (
      <TextField
        select
        label={label}
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={Boolean(fieldState.error)}
        helperText={fieldState.error?.message}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    )}
  />
);

interface TemplateFormProps {
  template: OneDayEventTemplate;
  venues: VenueMasterEntry[];
  roomTypes: RoomTypeMasterEntry[];
  eventTypeNames: string[];
  menuItemOptions: MenuItemChip[];
  onSaved: () => void;
}

const TemplateForm = ({ template, venues, roomTypes, eventTypeNames, menuItemOptions, onSaved }: TemplateFormProps) => {
  const { showSuccess, showError } = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);
  const activeVenues = venues.filter((venue) => venue.active);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<OneDayEventFormValues>({
    defaultValues: toOneDayEventFormValues(template, venues, roomTypes),
  });
  const roomLines = useFieldArray({ control, name: 'roomLines' });
  const ceremonies = useFieldArray({ control, name: 'ceremonies' });
  const meals = useFieldArray({ control, name: 'meals' });
  const lineItems = useFieldArray({ control, name: 'lineItems' });

  const createMenuItemMutation = tsr.createMenuItem.useMutation();
  const updateTemplateMutation = tsr.updateOneDayEventTemplate.useMutation();

  const eventFamilyType = watch('eventFamilyType');
  const sessionType = watch('sessionType');
  const venue = watch('venue');

  const handleVenueChange = (venueName: string) => {
    setValue('venue', venueName, { shouldDirty: true });
    const selected = activeVenues.find((candidate) => candidate.name === venueName);
    if (selected) {
      setValue('venueCost', selected.defaultVenueCost, { shouldDirty: true });
    }
  };

  // A chip typed as a new name is created in the Menu Items master first
  // (same find-or-create the wizard's Food/Dining card does).
  const resolveChip = async (chip: MenuItemChip): Promise<MenuItemChip> => {
    if (chip.id) {
      return chip;
    }
    const response = await createMenuItemMutation.mutateAsync({ body: { name: chip.name } });
    return { id: response.body.id, name: response.body.name };
  };

  const handleSave = handleSubmit(async (values) => {
    setSaveError(null);
    let resolvedMeals: OneDayEventFormValues['meals'];
    try {
      resolvedMeals = await Promise.all(
        values.meals.map(async (meal) => ({ ...meal, menuItems: await Promise.all(meal.menuItems.map(resolveChip)) }))
      );
    } catch {
      setSaveError(NEW_MENU_ITEM_ERROR);
      showError(NEW_MENU_ITEM_ERROR);
      return;
    }
    try {
      const response = await updateTemplateMutation.mutateAsync({
        body: toOneDayEventTemplateBody({ ...values, meals: resolvedMeals }, venues, template.session.setup),
      });
      reset(toOneDayEventFormValues(response.body, venues, roomTypes));
      showSuccess(SAVED_MESSAGE);
      onSaved();
    } catch {
      setSaveError(SAVE_ERROR);
      showError(SAVE_ERROR);
    }
  });

  return (
    <Box component="form" aria-label="One Day Event template" onSubmit={handleSave} noValidate sx={panelStyles}>
      <Box sx={saveHeaderStyles}>
        <Typography variant="titleM" component="h2">
          One Day Event
        </Typography>
        <Button type="submit" variant="contained" disabled={!isDirty} loading={isSubmitting}>
          Save template
        </Button>
      </Box>
      <Typography variant="bodyM" color="text.secondary">
        These values prefill a new event when someone chooses One Day Event in the New Event wizard. The event date is
        picked then; check-in and check-out stay empty.
      </Typography>
      {saveError && (
        <Alert severity="error">
          <Typography variant="bodyM">{saveError}</Typography>
        </Alert>
      )}

      <Paper elevation={0} component="section" aria-labelledby="one-day-event-card" sx={cardStyles}>
        <Typography id="one-day-event-card" variant="titleM" component="h3">
          Event
        </Typography>
        <Box sx={eventFieldsStyles}>
          <SelectField
            label="Event type"
            name="eventFamilyType"
            options={withCurrent(EVENT_FAMILY_TYPE_PRESETS, eventFamilyType)}
            control={control}
          />
          <SelectField
            label="Session type"
            name="sessionType"
            options={withCurrent(eventTypeNames, sessionType)}
            control={control}
          />
          <TextField label="Pax" type="number" slotProps={NUMBER_INPUT} {...register('pax', { valueAsNumber: true })} />
          <TextField
            label="Food GST %"
            type="number"
            slotProps={PERCENT_INPUT}
            {...register('gstPercent', { valueAsNumber: true })}
          />
          <TextField select label="Venue" value={venue} onChange={(event) => handleVenueChange(event.target.value)}>
            {withCurrent(
              activeVenues.map((candidate) => candidate.name),
              venue
            ).map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Venue Cost"
            type="number"
            slotProps={RUPEE_NUMBER_INPUT}
            {...register('venueCost', { valueAsNumber: true })}
          />
          <TimeField label="Start time" name="startTime" register={register} error={errors.startTime?.message} />
          <TimeField label="End time" name="endTime" register={register} error={errors.endTime?.message} />
        </Box>
        <Typography variant="bodyS" color="text.secondary">
          Venue Cost fills in from the Venues master when you pick a venue; you can change it.
        </Typography>
      </Paper>

      <Paper elevation={0} component="section" aria-labelledby="one-day-rooms-card" sx={cardStyles}>
        <Typography id="one-day-rooms-card" variant="titleM" component="h3">
          Rooms
        </Typography>
        <Box sx={roomsTableWrapperStyles}>
          <Table aria-label="Template rooms">
            <TableHead>
              <TableRow>
                <TableCell>Room type</TableCell>
                <TableCell align="right">Occupancy</TableCell>
                <TableCell align="right">Default Tariff</TableCell>
                <TableCell>Rooms</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomLines.fields.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell>{line.roomType}</TableCell>
                  <TableCell align="right">{line.occupancy}</TableCell>
                  <TableCell align="right">{formatAmount(line.tariff)}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      sx={roomsInputStyles}
                      slotProps={{ htmlInput: { min: 0, 'aria-label': `${line.roomType} rooms` } }}
                      {...register(`roomLines.${index}.noOfRooms`, { valueAsNumber: true })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Typography variant="bodyS" color="text.secondary">
          Occupancy and tariff come from Room Types. Only the number of rooms is part of the template.
        </Typography>
      </Paper>

      <Paper elevation={0} component="section" aria-labelledby="one-day-ceremonies-card" sx={cardStyles}>
        <Typography id="one-day-ceremonies-card" variant="titleM" component="h3">
          Ceremony events
        </Typography>
        {ceremonies.fields.map((ceremony, index) => (
          <Box key={ceremony.id} role="group" aria-label={`Ceremony event ${index + 1}`} sx={ceremonyRowStyles}>
            <NameAutocomplete
              label="Event name"
              name={`ceremonies.${index}.eventName`}
              presets={CEREMONY_EVENT_NAME_PRESETS}
              control={control}
            />
            <TimeField
              label="Start time"
              name={`ceremonies.${index}.startTime`}
              register={register}
              error={errors.ceremonies?.[index]?.startTime?.message}
            />
            <TimeField
              label="End time"
              name={`ceremonies.${index}.endTime`}
              register={register}
              error={errors.ceremonies?.[index]?.endTime?.message}
            />
            <IconButton
              aria-label={`Remove ceremony event ${index + 1}`}
              onClick={() => ceremonies.remove(index)}
              sx={removeButtonStyles}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="ghost"
          startIcon={<AddIcon />}
          onClick={() => ceremonies.append(EMPTY_CEREMONY)}
          sx={addButtonStyles}
        >
          Add ceremony event
        </Button>
      </Paper>

      <Paper elevation={0} component="section" aria-labelledby="one-day-meals-card" sx={cardStyles}>
        <Typography id="one-day-meals-card" variant="titleM" component="h3">
          Meals
        </Typography>
        {meals.fields.map((meal, index) => (
          <Box key={meal.id} role="group" aria-label={`Meal ${index + 1}`} sx={mealPanelStyles}>
            <Box sx={mealFieldsStyles}>
              <NameAutocomplete
                label="Meal name"
                name={`meals.${index}.mealName`}
                presets={MEAL_NAME_PRESETS}
                control={control}
              />
              <TimeField
                label="Start time"
                name={`meals.${index}.startTime`}
                register={register}
                error={errors.meals?.[index]?.startTime?.message}
              />
              <TimeField
                label="End time"
                name={`meals.${index}.endTime`}
                register={register}
                error={errors.meals?.[index]?.endTime?.message}
              />
              <TextField
                label="Pax"
                type="number"
                slotProps={NUMBER_INPUT}
                {...register(`meals.${index}.pax`, { valueAsNumber: true })}
              />
              <TextField
                label="Cost per Plate"
                type="number"
                slotProps={RUPEE_NUMBER_INPUT}
                {...register(`meals.${index}.costPerPlate`, { valueAsNumber: true })}
              />
              <IconButton
                aria-label={`Remove meal ${index + 1}`}
                onClick={() => meals.remove(index)}
                sx={removeButtonStyles}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Controller
              control={control}
              name={`meals.${index}.limitedSeating`}
              render={({ field }) => (
                <FormControlLabel
                  label="L.S."
                  control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
                />
              )}
            />
            <Controller
              control={control}
              name={`meals.${index}.menuItems`}
              render={({ field }) => (
                <MenuItemSearch options={menuItemOptions} value={field.value} onChange={field.onChange} />
              )}
            />
          </Box>
        ))}
        <Button variant="ghost" startIcon={<AddIcon />} onClick={() => meals.append(EMPTY_MEAL)} sx={addButtonStyles}>
          Add meal
        </Button>
      </Paper>

      <Paper elevation={0} component="section" aria-labelledby="one-day-line-items-card" sx={cardStyles}>
        <Typography id="one-day-line-items-card" variant="titleM" component="h3">
          Line items
        </Typography>
        {lineItems.fields.map((lineItem, index) => (
          <Box key={lineItem.id} role="group" aria-label={`Line item ${index + 1}`} sx={lineItemRowStyles}>
            <TextField
              label="Name"
              error={Boolean(errors.lineItems?.[index]?.name)}
              helperText={errors.lineItems?.[index]?.name?.message}
              {...register(`lineItems.${index}.name`, REQUIRED)}
            />
            <TextField label="Note (optional)" {...register(`lineItems.${index}.note`)} />
            <TextField
              label="Total Cost with GST"
              type="number"
              slotProps={NUMBER_INPUT}
              {...register(`lineItems.${index}.amount`, { valueAsNumber: true })}
            />
            <IconButton
              aria-label={`Remove line item ${index + 1}`}
              onClick={() => lineItems.remove(index)}
              sx={removeButtonStyles}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="ghost"
          startIcon={<AddIcon />}
          onClick={() => lineItems.append(EMPTY_LINE_ITEM)}
          sx={addButtonStyles}
        >
          Add line item
        </Button>
      </Paper>
    </Box>
  );
};

// Settings → One Day Event (CR-1 D1, UI-41): the template the New Event
// wizard's "One Day Event" button prefills from.
const OneDayEventSettings = () => {
  const templateQuery = tsr.getOneDayEventTemplate.useQuery({ queryKey: ['one-day-event-template'] });
  const venuesQuery = tsr.listVenues.useQuery({ queryKey: ['venues'] });
  const roomTypesQuery = tsr.listRoomTypes.useQuery({ queryKey: ['room-types'] });
  const eventTypesQuery = tsr.listEventTypes.useQuery({ queryKey: ['event-types'] });
  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });

  const template = templateQuery.data?.body;
  const venues = venuesQuery.data?.body;
  const roomTypes = roomTypesQuery.data?.body;

  if (templateQuery.isError) {
    return (
      <Alert severity="error">
        <Typography variant="bodyM">The One Day Event template couldn’t be loaded. Please try again.</Typography>
      </Alert>
    );
  }
  if (!template || !venues || !roomTypes || eventTypesQuery.isPending || menuItemsQuery.isPending) {
    return (
      <Box sx={loadingStyles}>
        <CircularProgress aria-label="Loading the One Day Event template" />
      </Box>
    );
  }

  const eventTypeNames = (eventTypesQuery.data?.body ?? [])
    .filter((eventType) => eventType.active)
    .map((eventType) => eventType.name);
  const menuItemOptions = (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
    id: menuItem.id,
    name: menuItem.name,
  }));

  const handleSaved = () => {
    templateQuery.refetch();
    menuItemsQuery.refetch();
  };

  return (
    <TemplateForm
      template={template}
      venues={venues}
      roomTypes={roomTypes}
      eventTypeNames={eventTypeNames}
      menuItemOptions={menuItemOptions}
      onSaved={handleSaved}
    />
  );
};

export default OneDayEventSettings;
