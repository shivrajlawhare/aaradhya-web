import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import { Box, Button } from '@mui/material';
import { actionButtonStyles, toolbarStyles } from './wizard-item-actions.styles';

export type WizardItemCardKind = 'ceremony' | 'food';

export const CEREMONY_CARD_ID = 'ceremony-events-card';
export const FOOD_CARD_ID = 'food-events-card';

interface WizardItemActionsProps {
  openCard: WizardItemCardKind | null;
  isDesktop: boolean;
  onToggle: (kind: WizardItemCardKind) => void;
}

// The Sessions & Items action row (Figma Wizard/Item Actions, below the
// combined list — R2): each button opens its card under the row, or closes
// it when it's already open. aria-expanded carries the Selected state for
// assistive tech.
const WizardItemActions = ({ openCard, isDesktop, onToggle }: WizardItemActionsProps) => {
  const size = isDesktop ? 'medium' : 'small';
  const isCeremonyOpen = openCard === 'ceremony';
  const isFoodOpen = openCard === 'food';
  // Only point at a card that is actually rendered.
  const ceremonyControls = isCeremonyOpen ? CEREMONY_CARD_ID : undefined;
  const foodControls = isFoodOpen ? FOOD_CARD_ID : undefined;

  return (
    <Box role="toolbar" aria-label="Add items" sx={toolbarStyles}>
      <Button
        variant="tonal"
        size={size}
        startIcon={<CelebrationOutlinedIcon />}
        aria-expanded={isCeremonyOpen}
        aria-controls={ceremonyControls}
        onClick={() => onToggle('ceremony')}
        sx={actionButtonStyles(isCeremonyOpen, false)}
      >
        Add Ceremony
      </Button>
      <Button
        variant="tonal"
        size={size}
        startIcon={<RestaurantOutlinedIcon />}
        aria-expanded={isFoodOpen}
        aria-controls={foodControls}
        onClick={() => onToggle('food')}
        sx={actionButtonStyles(isFoodOpen, true)}
      >
        Add Food/Dining Event
      </Button>
    </Box>
  );
};

export default WizardItemActions;
