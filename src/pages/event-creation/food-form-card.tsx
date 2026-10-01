import type { FormEventHandler } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { formatQuotationPax } from '../../utils/quotation-formatting';
import MenuItemSearch, { type MenuItemChip } from '../event-detail/menu-item-search';
import ItemTimeClocks from './item-time-clocks';
import { CUSTOM_MEAL_NAME_OPTION, type FoodFormValues, MEAL_NAME_PRESETS } from './sessions-items-forms';
import {
  costFieldStyles,
  fieldColumnStyles,
  formActionsStyles,
  lsLabelStyles,
  lsToggleStyles,
  paxFieldStyles,
  paxRowStyles,
  previewLineStyles,
  sectionBodyStyles,
  sectionCardStyles,
} from './sessions-items-step.styles';
import { FOOD_CARD_ID } from './wizard-item-actions';

const RUPEE_ADORNMENT = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };

interface FoodFormCardProps {
  form: UseFormReturn<FoodFormValues>;
  menuItemOptions: MenuItemChip[];
  isEditing: boolean;
  // A new menu item is being created — submit and Cancel edit wait for it.
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancelEdit: () => void;
}

// The Food/Dining Events card (Figma 05 New Event / 4): Meal Name, Pax ·
// L.S. · Cost, Menu items and the "Shown on Quotation as" preview on the
// left, Start/End clocks on the right.
const FoodFormCard = ({
  form,
  menuItemOptions,
  isEditing,
  isSubmitting,
  submitError,
  onSubmit,
  onCancelEdit,
}: FoodFormCardProps) => {
  const mealNameOption = form.watch('mealNameOption');
  const pax = form.watch('pax');
  const limitedSeating = form.watch('limitedSeating');
  const submitLabel = isEditing ? 'Save Food/Dining Event' : 'Add Food/Dining Event';
  const costFieldLabel = limitedSeating ? 'Flat Cost' : 'Cost per Plate';
  const safePax = Number.isFinite(pax) ? pax : 0;

  return (
    <Paper
      elevation={0}
      component="form"
      id={FOOD_CARD_ID}
      aria-label="Food/Dining Events"
      onSubmit={onSubmit}
      sx={sectionCardStyles}
    >
      <Typography variant="titleM" component="h2">
        Food/Dining Events
      </Typography>
      <Box sx={sectionBodyStyles}>
        <Stack sx={fieldColumnStyles}>
          <Controller
            name="mealNameOption"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label="Meal Name">
                <MenuItem value="">Select a meal name</MenuItem>
                {MEAL_NAME_PRESETS.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
                <MenuItem value={CUSTOM_MEAL_NAME_OPTION}>{CUSTOM_MEAL_NAME_OPTION}</MenuItem>
              </TextField>
            )}
          />
          {mealNameOption === CUSTOM_MEAL_NAME_OPTION && (
            <TextField {...form.register('mealNameCustom')} fullWidth label="Custom meal name" />
          )}
          <Box sx={paxRowStyles}>
            <TextField
              {...form.register('pax', { valueAsNumber: true })}
              label="Pax"
              type="number"
              sx={paxFieldStyles}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <Stack sx={lsToggleStyles}>
              <Typography variant="labelM" component="span" sx={lsLabelStyles}>
                L.S.
              </Typography>
              <Controller
                name="limitedSeating"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    slotProps={{ input: { 'aria-label': 'Limited Seating' } }}
                  />
                )}
              />
            </Stack>
            <TextField
              {...form.register('costPerPlate', { valueAsNumber: true })}
              label={costFieldLabel}
              type="number"
              sx={costFieldStyles}
              slotProps={{ htmlInput: { min: 0 }, ...RUPEE_ADORNMENT }}
            />
          </Box>
          <Controller
            name="menuItems"
            control={form.control}
            render={({ field }) => (
              <MenuItemSearch options={menuItemOptions} value={field.value} onChange={field.onChange} />
            )}
          />
          <Typography variant="bodyM" sx={previewLineStyles}>
            Shown on Quotation as: {formatQuotationPax(safePax, limitedSeating)}
          </Typography>
          {submitError && (
            <Alert severity="error">
              <Typography variant="bodyM">{submitError}</Typography>
            </Alert>
          )}
          <Box sx={formActionsStyles}>
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={isSubmitting}>
              {submitLabel}
            </Button>
            {isEditing && (
              // Disabled while the async submit (menu item resolution) is in
              // flight — otherwise clicking Cancel here doesn't actually stop
              // that in-flight save, which still applies to this row once it
              // resolves, silently overwriting whatever the user believed
              // they'd backed out of.
              <Button variant="ghost" onClick={onCancelEdit} disabled={isSubmitting}>
                Cancel edit
              </Button>
            )}
          </Box>
        </Stack>
        <ItemTimeClocks
          startTime={form.watch('startTime')}
          endTime={form.watch('endTime')}
          onStartTimeChange={(value) => form.setValue('startTime', value)}
          onEndTimeChange={(value) => form.setValue('endTime', value)}
        />
      </Box>
    </Paper>
  );
};

export default FoodFormCard;
