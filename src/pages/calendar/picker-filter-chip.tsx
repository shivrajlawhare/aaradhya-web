import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import FilterChip from './filter-chip';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerFilterChipProps {
  label: string;
  options: PickerOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  // Overrides the default "All {label}s" clear-option text — needed
  // wherever appending 's' doesn't read right (e.g. "Status" -> "All
  // Statuses", not "All Statuss").
  allLabel?: string;
}

// Shared by the Status/Venue/Event/Event Manager/Event Type filters (this
// story's own AC: each "opens a selectable list sourced from actual
// existing values"). The chip's own label switches to the selected
// option's label once one is chosen (e.g. "Venue" becomes "Lawn") so the
// active chip itself carries which value is filtering, not just that some
// value is.
const PickerFilterChip = ({ label, options, selectedValue, onSelect, allLabel }: PickerFilterChipProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const selectedOption = options.find((option) => option.value === selectedValue) ?? null;

  const handleSelect = (value: string | null) => {
    onSelect(value);
    setAnchorEl(null);
  };

  return (
    <>
      <FilterChip
        label={selectedOption?.label ?? label}
        active={selectedOption !== null}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      />
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
        <MenuItem selected={selectedValue === null} onClick={() => handleSelect(null)}>
          {allLabel ?? `All ${label}s`}
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} selected={option.value === selectedValue} onClick={() => handleSelect(option.value)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default PickerFilterChip;
