import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ActiveStatusChip from '../../components/ui/active-status-chip';
import { visuallyHiddenStyles } from '../../components/ui/visually-hidden.styles';
import MasterListEmptyState from './master-list-empty-state';
import {
  costCellStyles,
  editCellStyles,
  occupancyCellStyles,
  panelBodyStyles,
  statusCellStyles,
  tableCardStyles,
} from './master-list-table.styles';
import type { MasterListRow, SectionConfig } from './settings-sections';

interface MasterListTableProps {
  section: SectionConfig;
  rows: MasterListRow[];
  isMutating: boolean;
  onToggleActive: (row: MasterListRow) => void;
  onEdit: (row: MasterListRow) => void;
}

// Figma Table/Master List (UI-29, UI-40): Name fills · Occupancy (Room
// Types) · the section's cost · Status (chip + switch; not Menu Items) ·
// Edit. Numbers are right-aligned and printed raw, as entered. An empty
// section keeps the header and shows its empty state below (D16).
const MasterListTable = ({ section, rows, isMutating, onToggleActive, onEdit }: MasterListTableProps) => (
  <Box sx={panelBodyStyles}>
    <Paper elevation={0} sx={tableCardStyles}>
      <Table aria-label={section.label}>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="labelS">Name</Typography>
            </TableCell>
            {section.supportsOccupancy && (
              <TableCell align="right" sx={occupancyCellStyles}>
                <Typography variant="labelS">Occupancy</Typography>
              </TableCell>
            )}
            {section.costLabel && (
              <TableCell align="right" sx={costCellStyles}>
                <Typography variant="labelS">{section.costLabel}</Typography>
              </TableCell>
            )}
            {section.supportsStatus && (
              <TableCell sx={statusCellStyles}>
                <Typography variant="labelS">Status</Typography>
              </TableCell>
            )}
            {section.supportsEdit && (
              <TableCell sx={editCellStyles}>
                <Box component="span" sx={visuallyHiddenStyles}>
                  Edit
                </Box>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              {section.supportsOccupancy && (
                <TableCell align="right" sx={occupancyCellStyles}>
                  {row.occupancy}
                </TableCell>
              )}
              {section.costLabel && (
                <TableCell align="right" sx={costCellStyles}>
                  {row.cost}
                </TableCell>
              )}
              {section.supportsStatus && (
                <TableCell sx={statusCellStyles}>
                  <ActiveStatusChip active={row.active} />
                  <Switch
                    checked={row.active}
                    disabled={isMutating}
                    onChange={() => onToggleActive(row)}
                    slotProps={{ input: { 'aria-label': `Toggle active for ${row.name}` } }}
                  />
                </TableCell>
              )}
              {section.supportsEdit && (
                <TableCell sx={editCellStyles}>
                  <IconButton aria-label={`Edit ${row.name}`} disabled={isMutating} onClick={() => onEdit(row)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
    {rows.length === 0 && <MasterListEmptyState section={section} />}
  </Box>
);

export default MasterListTable;
