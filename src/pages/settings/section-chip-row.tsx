import { Box, Chip } from '@mui/material';
import { chipStyles, rowStyles } from './section-chip-row.styles';
import { type SectionId, SECTIONS } from './settings-sections';

interface SectionChipRowProps {
  selected: SectionId;
  onSelect: (section: SectionId) => void;
}

// Mobile's section selector (this story's own AC) — a horizontally
// scrollable chip row above the card list, in place of desktop's left-hand
// SectionNavList.
const SectionChipRow = ({ selected, onSelect }: SectionChipRowProps) => (
  <Box role="tablist" aria-label="Settings sections" sx={rowStyles}>
    {SECTIONS.map((section) => (
      <Chip
        key={section.id}
        role="tab"
        aria-selected={section.id === selected}
        label={section.label}
        onClick={() => onSelect(section.id)}
        sx={chipStyles(section.id === selected)}
      />
    ))}
  </Box>
);

export default SectionChipRow;
