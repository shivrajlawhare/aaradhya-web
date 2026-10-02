import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, IconButton, Paper, Switch, Typography } from '@mui/material';
import ActiveStatusChip from '../../components/ui/active-status-chip';
import {
  actionsRowStyles,
  cardStyles,
  headerRowStyles,
  listStyles,
  metaStyles,
  spacerStyles,
} from './master-list-card-list.styles';
import MasterListEmptyState from './master-list-empty-state';
import type { MasterListRow, SectionConfig } from './settings-sections';

interface MasterListCardListProps {
  section: SectionConfig;
  rows: MasterListRow[];
  isMutating: boolean;
  onToggleActive: (row: MasterListRow) => void;
  onEdit: (row: MasterListRow) => void;
}

// "Occupancy: 2 · Default Tariff: 2800" — the card's meta line; null for a
// section with nothing to show (Event Types).
const buildMetaLine = (section: SectionConfig, row: MasterListRow): string | null => {
  const parts: string[] = [];
  if (section.supportsOccupancy) {
    parts.push(`Occupancy: ${row.occupancy}`);
  }
  if (section.costLabel) {
    parts.push(`${section.costLabel}: ${row.cost}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
};

// Mobile's master list (Figma Card/Master Item, UI-29/UI-40): name + status
// chip, the meta line, then the active switch (left) and Edit (right). The
// switch and the status are for sections that have them — never Menu Items.
// An empty section shows its empty state (D16).
const MasterListCardList = ({ section, rows, isMutating, onToggleActive, onEdit }: MasterListCardListProps) => {
  if (rows.length === 0) {
    return <MasterListEmptyState section={section} />;
  }

  return (
    <Box component="ul" aria-label={section.label} sx={listStyles}>
      {rows.map((row) => {
        const metaLine = buildMetaLine(section, row);
        const isActive = !section.supportsStatus || row.active;
        return (
          <Paper component="li" key={row.id} elevation={0} sx={cardStyles(isActive)}>
            <Box sx={headerRowStyles}>
              <Typography variant="titleM" component="h3">
                {row.name}
              </Typography>
              {section.supportsStatus && <ActiveStatusChip active={row.active} />}
            </Box>
            {metaLine && (
              <Typography variant="bodyM" sx={metaStyles}>
                {metaLine}
              </Typography>
            )}
            <Box sx={actionsRowStyles}>
              {section.supportsStatus && (
                <Switch
                  checked={row.active}
                  disabled={isMutating}
                  onChange={() => onToggleActive(row)}
                  slotProps={{ input: { 'aria-label': `Toggle active for ${row.name}` } }}
                />
              )}
              <Box sx={spacerStyles} />
              {section.supportsEdit && (
                <IconButton aria-label={`Edit ${row.name}`} disabled={isMutating} onClick={() => onEdit(row)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default MasterListCardList;
