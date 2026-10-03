import type { KeyboardEvent, ReactNode } from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import { cardStyles, headerStyles, typeLabelStyles } from './item-card.styles';

export interface ItemCardEditableProps {
  removeLabel: string;
  isEditing: boolean;
  isRemoveDisabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

interface ItemCardProps {
  // "Ceremony" / "Food/dining" — both kinds share one list (R2).
  typeLabel: string;
  title: string;
  // Absent for a read-only viewer (e.g. the F&B Head): no edit, no delete.
  editable?: ItemCardEditableProps;
  children?: ReactNode;
}

// Figma Card/Item: one Ceremony or Food/Dining Item (wizard step 4 and the
// Event Detail Sessions & Items tab). When editable, clicking it (or
// Enter/Space) loads it into its card for editing — the same row pattern as
// step 2's added events; the delete button doesn't trigger the edit.
const ItemCard = ({ typeLabel, title, editable, children }: ItemCardProps) => {
  const heading = (
    <Box>
      <Typography variant="labelS" component="p" sx={typeLabelStyles}>
        {typeLabel}
      </Typography>
      <Typography variant="titleS" component="p">
        {title}
      </Typography>
    </Box>
  );

  if (!editable) {
    return (
      <Box sx={cardStyles(false, false)}>
        {heading}
        {children}
      </Box>
    );
  }

  const { removeLabel, isEditing, isRemoveDisabled = false, onEdit, onRemove } = editable;
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
      sx={cardStyles(isEditing, true)}
    >
      <Box sx={headerStyles}>
        {heading}
        <IconButton
          aria-label={removeLabel}
          size="small"
          disabled={isRemoveDisabled}
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

export default ItemCard;
