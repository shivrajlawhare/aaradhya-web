import { type ReactNode, useState } from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import { formatRupees } from '../../../pages/event-detail/format-amount';
import LineItemForm, { type LineItemValues } from './line-item-form';
import {
  editorStyles,
  emptyTextStyles,
  headingStyles,
  listStyles,
  rowActionsStyles,
  rowAmountStyles,
  rowNoteStyles,
  rowStyles,
  rowTextStyles,
} from './line-items-editor.styles';

export interface LineItem {
  name: string;
  note: string | null;
  amount: number;
}

export type LineItemChange = 'added' | 'saved' | 'removed';

const HEADING = 'Line items';
const EMPTY_TEXT = 'No line items yet';
const ADD_LABEL = 'Add line item';

const toLineItem = (values: LineItemValues): LineItem => ({
  name: values.name,
  note: values.note || null,
  amount: values.amount,
});

interface LineItemsEditorProps {
  items: LineItem[];
  // Without it the list is read-only: rows only, no actions, no form.
  canEdit: boolean;
  // The whole next list; reject to keep the form as typed.
  onItemsChange?: (items: LineItem[], change: LineItemChange) => Promise<void>;
}

// Figma Panel/Line Items Editor (UI-48): the extra line items as
// name · note · amount rows with Edit / Remove, over the shared line-item
// form (DEV-20). Every change hands the full list back to the caller.
const LineItemsEditor = ({ items, canEdit, onItemsChange }: LineItemsEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSubmit = async (values: LineItemValues) => {
    if (!onItemsChange) {
      return;
    }
    const item = toLineItem(values);
    if (editingIndex === null) {
      await onItemsChange([...items, item], 'added');
      return;
    }
    await onItemsChange(
      items.map((current, index) => (index === editingIndex ? item : current)),
      'saved'
    );
    setEditingIndex(null);
  };

  const handleRemove = async (removeIndex: number) => {
    if (!onItemsChange) {
      return;
    }
    setIsRemoving(true);
    try {
      await onItemsChange(
        items.filter((_item, index) => index !== removeIndex),
        'removed'
      );
      setEditingIndex(null);
    } catch {
      // The caller already reported the failure.
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  let list: ReactNode = (
    <Typography variant="bodyM" sx={emptyTextStyles}>
      {EMPTY_TEXT}
    </Typography>
  );
  if (items.length > 0) {
    list = (
      <Box component="ul" sx={listStyles}>
        {items.map((item, index) => (
          <Box component="li" key={`${index}-${item.name}`} sx={rowStyles}>
            <Box sx={rowTextStyles}>
              <Typography variant="bodyM" component="p">
                {item.name}
              </Typography>
              {item.note && (
                <Typography variant="bodyS" component="p" sx={rowNoteStyles}>
                  {item.note}
                </Typography>
              )}
            </Box>
            <Typography variant="numeric" sx={rowAmountStyles}>
              {formatRupees(item.amount)}
            </Typography>
            {canEdit && (
              <Box sx={rowActionsStyles}>
                <IconButton
                  aria-label={`Edit ${item.name} line item`}
                  size="small"
                  disabled={isRemoving}
                  onClick={() => setEditingIndex(index)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label={`Remove ${item.name} line item`}
                  size="small"
                  disabled={isRemoving}
                  onClick={() => handleRemove(index)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  const editingItem = editingIndex === null ? undefined : items[editingIndex];

  return (
    <Box component="section" aria-label={HEADING} sx={editorStyles}>
      <Typography variant="labelS" component="h3" sx={headingStyles}>
        {HEADING}
      </Typography>
      {list}
      {canEdit && (
        <LineItemForm
          // A new key per row, so the form starts from the row being edited.
          key={editingIndex ?? 'add'}
          addLabel={ADD_LABEL}
          editing={editingItem && { ...editingItem, note: editingItem.note ?? '' }}
          onCancelEdit={handleCancelEdit}
          onSubmit={handleSubmit}
          disabled={isRemoving}
        />
      )}
    </Box>
  );
};

export default LineItemsEditor;
