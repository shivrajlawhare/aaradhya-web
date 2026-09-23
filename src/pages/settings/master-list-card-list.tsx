import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, IconButton, Paper, Stack, Switch, Typography } from '@mui/material';
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
import type { MasterListRow, SectionConfig } from './settings-sections';

interface MasterListCardListProps {
  section: SectionConfig;
  rows: MasterListRow[];
  isMutating: boolean;
  onToggleActive: (row: MasterListRow) => void;
  onEdit: (row: MasterListRow) => void;
}

// Mobile's card list (this story's own AC): one card per entry —
// name + default cost + status — below SectionChipRow, matching
// STORY-055/056's card pattern (events-card-list.tsx). The Deactivate/
// Reactivate toggle (`supportsStatus`) and the Edit action (`supportsEdit`)
// are independent — Menu Items has the latter but not the former
// (settings-sections.ts for why); the actions row renders if either is on.
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
          {(section.supportsStatus || section.supportsEdit) && (
            <Box sx={actionsRowStyles}>
              {section.supportsStatus && (
                <Switch
                  checked={row.active}
                  disabled={isMutating}
                  onChange={() => onToggleActive(row)}
                  slotProps={{ input: { 'aria-label': `Toggle active for ${row.name}` } }}
                />
              )}
              {section.supportsEdit && (
                <IconButton aria-label={`Edit ${row.name}`} disabled={isMutating} onClick={() => onEdit(row)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
};

export default MasterListCardList;
