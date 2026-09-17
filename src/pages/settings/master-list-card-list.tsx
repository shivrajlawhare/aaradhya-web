import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, IconButton, Paper, Stack, Switch, Typography } from '@mui/material';
import type { MasterListRow, SectionConfig } from './settings-sections';
import {
  actionsRowStyles,
  activeStatusStyles,
  cardStyles,
  costStyles,
  emptyStateCardStyles,
  headerRowStyles,
  inactiveStatusStyles,
  listStyles,
} from './master-list-card-list.styles';

interface MasterListCardListProps {
  section: SectionConfig;
  rows: MasterListRow[];
  isMutating: boolean;
  onToggleActive: (row: MasterListRow) => void;
  onEdit: (row: MasterListRow) => void;
}

// Mobile's card list (this story's own AC): one card per entry —
// name + default cost + status — below SectionChipRow, matching
// STORY-055/056's card pattern (events-card-list.tsx). Edit and the
// Deactivate/Reactivate toggle live here too, not display-only like
// UsersCardList — this story's own AC asks for both on every row.
const MasterListCardList = ({ section, rows, isMutating, onToggleActive, onEdit }: MasterListCardListProps) => {
  if (rows.length === 0) {
    return (
      <Paper elevation={0} sx={emptyStateCardStyles}>
        <Typography variant="bodyM">No {section.label.toLowerCase()} yet</Typography>
      </Paper>
    );
  }

  return (
    <Stack sx={listStyles}>
      {rows.map((row) => (
        <Paper key={row.id} elevation={0} sx={cardStyles(section.supportsStatus ? row.active : true)}>
          <Box sx={headerRowStyles}>
            <Typography variant="titleM">{row.name}</Typography>
            {section.supportsStatus && (
              <Typography variant="labelS" sx={row.active ? activeStatusStyles : inactiveStatusStyles}>
                {row.active ? 'Active' : 'Inactive'}
              </Typography>
            )}
          </Box>
          {section.costLabel && (
            <Typography variant="bodyM" sx={costStyles}>
              {section.costLabel}: {row.cost}
            </Typography>
          )}
          {section.supportsStatus && (
            <Box sx={actionsRowStyles}>
              <Switch
                checked={row.active}
                disabled={isMutating}
                onChange={() => onToggleActive(row)}
                slotProps={{ input: { 'aria-label': `Toggle active for ${row.name}` } }}
              />
              <IconButton aria-label={`Edit ${row.name}`} onClick={() => onEdit(row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
};

export default MasterListCardList;
