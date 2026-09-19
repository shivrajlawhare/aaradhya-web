import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Chip, IconButton, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { SectionConfig, MasterListRow } from './settings-sections';
import { activeChipStyles, inactiveChipStyles, tableCardStyles } from './master-list-table.styles';

interface MasterListTableProps {
  section: SectionConfig;
  rows: MasterListRow[];
  isMutating: boolean;
  onToggleActive: (row: MasterListRow) => void;
  onEdit: (row: MasterListRow) => void;
}

// Desktop's right-hand panel body (this story's own AC): Name, Default Cost
// where the section has one, Status where the section has one — plus a
// Deactivate/Reactivate toggle (gated on `supportsStatus`) and an Edit
// action (gated on `supportsEdit`) as two independent columns, not one
// combined "Status" capability — Menu Items has the latter but not the
// former (settings-sections.ts for why).
const MasterListTable = ({ section, rows, isMutating, onToggleActive, onEdit }: MasterListTableProps) => (
  <Paper sx={tableCardStyles}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="labelS">Name</Typography>
          </TableCell>
          {section.costLabel && (
            <TableCell>
              <Typography variant="labelS">{section.costLabel}</Typography>
            </TableCell>
          )}
          {section.supportsStatus && (
            <TableCell>
              <Typography variant="labelS">Status</Typography>
            </TableCell>
          )}
          {section.supportsEdit && <TableCell />}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            {section.costLabel && <TableCell>{row.cost}</TableCell>}
            {section.supportsStatus && (
              <TableCell>
                <Chip
                  label={row.active ? 'Active' : 'Inactive'}
                  size="small"
                  variant="outlined"
                  sx={row.active ? activeChipStyles : inactiveChipStyles}
                />
                <Switch
                  checked={row.active}
                  disabled={isMutating}
                  onChange={() => onToggleActive(row)}
                  slotProps={{ input: { 'aria-label': `Toggle active for ${row.name}` } }}
                />
              </TableCell>
            )}
            {section.supportsEdit && (
              <TableCell>
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
);

export default MasterListTable;
