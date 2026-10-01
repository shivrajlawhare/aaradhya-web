import { Fragment, type ReactNode } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { ManualLineItem, TotalCostSummaryResult } from '../../utils/total-cost-summary';
import { formatAmount } from '../event-detail/format-amount';
import {
  amountCellStyles,
  captionStyles,
  dateRowStyles,
  foodCostAmountCellStyles,
  foodCostAmountStyles,
  foodCostLabelStyles,
  foodCostRowStyles,
  grandTotalAmountStyles,
  grandTotalRowStyles,
  gstFieldStyles,
  headerCellStyles,
  inlineLabelStyles,
  listItemStyles,
  listStyles,
  manualAmountStyles,
  summaryCardStyles,
  tableStyles,
} from './review-cost-summary.styles';

const PERCENT_ADORNMENT = { input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } };

interface ReviewCostSummaryProps {
  summary: TotalCostSummaryResult;
  gstPercent: number;
  isDesktop: boolean;
  onGstPercentChange: (value: number) => void;
  onRemoveManualItem: (id: string) => void;
}

interface GstPercentFieldProps {
  value: number;
  onChange: (value: number) => void;
}

// The Food Cost row's inline "GST %" input (label hidden, % suffix).
const GstPercentField = ({ value, onChange }: GstPercentFieldProps) => (
  <TextField
    type="number"
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
    sx={gstFieldStyles}
    slotProps={{ htmlInput: { min: 0, 'aria-label': 'GST %' }, ...PERCENT_ADORNMENT }}
  />
);

interface RemoveLineItemButtonProps {
  item: ManualLineItem;
  onRemove: (id: string) => void;
}

const RemoveLineItemButton = ({ item, onRemove }: RemoveLineItemButtonProps) => (
  <IconButton aria-label={`Remove ${item.name} line item`} size="small" onClick={() => onRemove(item.id)}>
    <CloseIcon fontSize="small" />
  </IconButton>
);

interface SummaryListItemProps {
  label: string;
  caption: string;
  amount: ReactNode;
}

// One mobile row: label over a caption, amount on the right.
const SummaryListItem = ({ label, caption, amount }: SummaryListItemProps) => (
  <Box component="li" sx={listItemStyles}>
    <Box>
      <Typography variant="bodyM">{label}</Typography>
      <Typography variant="bodyS" component="p" sx={captionStyles}>
        {caption}
      </Typography>
    </Box>
    {amount}
  </Box>
);

const grandTotalLabel = (
  <Typography variant="labelS" component="span">
    Grand Total
  </Typography>
);

// Step 5's Total Cost Summary (Figma 05 New Event / 5 Review): a table on
// desktop — first column fills, the four amount columns right-aligned —
// and a label / caption / amount list on mobile. Date rows sit on the subtle
// fill, the Food Cost row on accent-subtle with link-coloured amounts and
// the inline GST %, and the Grand Total on the orange accent.
const ReviewCostSummary = ({
  summary,
  gstPercent,
  isDesktop,
  onGstPercentChange,
  onRemoveManualItem,
}: ReviewCostSummaryProps) => {
  const gstField = <GstPercentField value={gstPercent} onChange={onGstPercentChange} />;
  const grandTotal = formatAmount(Math.round(summary.grandTotal));

  if (!isDesktop) {
    return (
      <Paper elevation={0} sx={summaryCardStyles}>
        <Box component="ul" aria-label="Total Cost Summary" sx={listStyles}>
          {summary.dateBlocks.map((block) => (
            <Fragment key={block.date}>
              <Box component="li" sx={dateRowStyles}>
                <Typography variant="h3" component="h3">
                  {block.dateLabel}
                </Typography>
              </Box>
              {block.venueRows.map((row) => (
                <SummaryListItem
                  key={row.id}
                  label={row.label}
                  caption="Total Cost with GST"
                  amount={<Typography variant="numeric">{formatAmount(row.amount)}</Typography>}
                />
              ))}
              {block.foodRows.map((row) => (
                <SummaryListItem
                  key={row.id}
                  label={row.label}
                  caption={`Pax ${row.paxDisplay} · Cost per Plate ${formatAmount(row.costPerPlate)}`}
                  amount={<Typography variant="numeric">{formatAmount(row.totalCost)}</Typography>}
                />
              ))}
            </Fragment>
          ))}
          <Box component="li" sx={foodCostRowStyles}>
            <Box sx={inlineLabelStyles}>
              <Typography variant="labelL" component="span" sx={foodCostLabelStyles}>
                Food Cost
              </Typography>
              {gstField}
            </Box>
            <Box sx={inlineLabelStyles}>
              <Typography variant="bodyS" sx={foodCostLabelStyles}>
                Total Cost
              </Typography>
              <Typography variant="numeric" sx={foodCostAmountStyles}>
                {formatAmount(summary.foodCostTotal)}
              </Typography>
            </Box>
            <Box sx={inlineLabelStyles}>
              <Typography variant="bodyS" sx={foodCostLabelStyles}>
                Total Cost with GST
              </Typography>
              <Typography variant="numeric" sx={foodCostAmountStyles}>
                {formatAmount(summary.foodCostWithGst)}
              </Typography>
            </Box>
          </Box>
          <SummaryListItem
            label="Accommodation"
            caption="Total Cost with GST"
            amount={<Typography variant="numeric">{formatAmount(summary.accommodationTotal)}</Typography>}
          />
          {summary.manualLineItems.map((item) => (
            <SummaryListItem
              key={item.id}
              label={item.name}
              caption={item.note}
              amount={
                <Box sx={manualAmountStyles}>
                  <Typography variant="numeric">{formatAmount(item.amount)}</Typography>
                  <RemoveLineItemButton item={item} onRemove={onRemoveManualItem} />
                </Box>
              }
            />
          ))}
          <Box component="li" sx={grandTotalRowStyles}>
            {grandTotalLabel}
            <Typography variant="h2" component="span" sx={grandTotalAmountStyles}>
              {grandTotal}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={summaryCardStyles}>
      <Table aria-label="Total Cost Summary" sx={tableStyles}>
        <TableHead>
          <TableRow>
            <TableCell>Sub Cost Item</TableCell>
            <TableCell align="right" sx={headerCellStyles}>
              Pax
            </TableCell>
            <TableCell align="right" sx={headerCellStyles}>
              Cost per Plate
            </TableCell>
            <TableCell align="right" sx={headerCellStyles}>
              Total Cost
            </TableCell>
            <TableCell align="right" sx={headerCellStyles}>
              Total Cost with GST
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summary.dateBlocks.map((block) => (
            <Fragment key={block.date}>
              <TableRow sx={dateRowStyles}>
                <TableCell colSpan={5}>
                  <Typography variant="h3" component="h3">
                    {block.dateLabel}
                  </Typography>
                </TableCell>
              </TableRow>
              {block.venueRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell align="right" sx={amountCellStyles}>
                    {formatAmount(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {block.foodRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right" sx={amountCellStyles}>
                    {row.paxDisplay}
                  </TableCell>
                  <TableCell align="right" sx={amountCellStyles}>
                    {formatAmount(row.costPerPlate)}
                  </TableCell>
                  <TableCell align="right" sx={amountCellStyles}>
                    {formatAmount(row.totalCost)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </Fragment>
          ))}

          <TableRow sx={foodCostRowStyles}>
            <TableCell>
              <Box sx={inlineLabelStyles}>
                <Typography variant="labelM" component="span" sx={foodCostLabelStyles}>
                  Food Cost
                </Typography>
                {gstField}
              </Box>
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right" sx={foodCostAmountCellStyles}>
              {formatAmount(summary.foodCostTotal)}
            </TableCell>
            <TableCell align="right" sx={foodCostAmountCellStyles}>
              {formatAmount(summary.foodCostWithGst)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Accommodation</TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell align="right" sx={amountCellStyles}>
              {formatAmount(summary.accommodationTotal)}
            </TableCell>
          </TableRow>

          {summary.manualLineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography variant="bodyM" component="p">
                  {item.name}
                </Typography>
                {item.note && (
                  <Typography variant="bodyS" component="p" sx={captionStyles}>
                    {item.note}
                  </Typography>
                )}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell align="right" sx={amountCellStyles}>
                <Box sx={manualAmountStyles}>
                  {formatAmount(item.amount)}
                  <RemoveLineItemButton item={item} onRemove={onRemoveManualItem} />
                </Box>
              </TableCell>
            </TableRow>
          ))}

          <TableRow sx={grandTotalRowStyles}>
            <TableCell colSpan={4}>{grandTotalLabel}</TableCell>
            <TableCell align="right">
              <Typography variant="h2" component="span" sx={grandTotalAmountStyles}>
                {grandTotal}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ReviewCostSummary;
