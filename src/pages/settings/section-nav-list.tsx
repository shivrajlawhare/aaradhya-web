import { Box } from '@mui/material';
import { SECTIONS, type SectionId } from './settings-sections';
import { navListStyles, sectionRowStyles } from './section-nav-list.styles';

interface SectionNavListProps {
  selected: SectionId;
  onSelect: (section: SectionId) => void;
}

// Desktop's left-hand section list (this story's own AC) — a vertical list
// of the four sections beside the right-hand panel showing whichever one is
// selected. See section-chip-row.tsx for the mobile equivalent.
const SectionNavList = ({ selected, onSelect }: SectionNavListProps) => (
  <Box component="nav" aria-label="Settings sections" sx={navListStyles}>
    {SECTIONS.map((section) => (
      <Box
        key={section.id}
        component="button"
        type="button"
        aria-current={section.id === selected ? 'true' : undefined}
        onClick={() => onSelect(section.id)}
        sx={sectionRowStyles(section.id === selected)}
      >
        {section.label}
      </Box>
    ))}
  </Box>
);

export default SectionNavList;
