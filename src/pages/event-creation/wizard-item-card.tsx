import type { KeyboardEvent, ReactNode } from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import { cardStyles, headerStyles } from './wizard-item-card.styles';

interface WizardItemCardProps {
  title: string;
  removeLabel: string;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  children?: ReactNode;
}

// Figma Card/Item: one added Ceremony or Food/Dining row. Clicking (or
// Enter/Space) loads it into its card for editing — the same row pattern as
// step 2's added events; the delete button doesn't trigger the edit.
const WizardItemCard = ({ title, removeLabel, isEditing, onEdit, onRemove, children }: WizardItemCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onEdit();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-pressed={isEditing}
      onClick={onEdit}
      onKeyDown={handleKeyDown}
      sx={cardStyles(isEditing)}
    >
      <Box sx={headerStyles}>
        <Typography variant="titleS" component="p">
          {title}
        </Typography>
        <IconButton
          aria-label={removeLabel}
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Box>
  );
};

export default WizardItemCard;
