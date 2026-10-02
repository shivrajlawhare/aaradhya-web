import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box } from '@mui/material';
import { checkIconStyles, navListStyles, sectionRowStyles } from './section-nav-list.styles';
import { type SectionId, SETTINGS_NAV } from './settings-sections';

interface SectionNavListProps {
  selected: SectionId;
  onSelect: (section: SectionId) => void;
}

// Desktop's sub-nav card (Figma 10 Settings): the five sections, the
// selected one tinted with a check, beside the right-hand panel. See
// section-chip-row.tsx for the mobile equivalent.
const SectionNavList = ({ selected, onSelect }: SectionNavListProps) => (
  <Box component="nav" aria-label="Settings sections" sx={navListStyles}>
    {SETTINGS_NAV.map((section) => {
      const isSelected = section.id === selected;
      // aria-current only on the selected section.
      let ariaCurrent: 'true' | undefined;
      if (isSelected) {
        ariaCurrent = 'true';
      }
      return (
        <Box
          key={section.id}
          component="button"
          type="button"
          aria-current={ariaCurrent}
          onClick={() => onSelect(section.id)}
          sx={sectionRowStyles(isSelected)}
        >
          {section.label}
          {isSelected && <CheckRoundedIcon fontSize="small" aria-hidden sx={checkIconStyles} />}
        </Box>
      );
    })}
  </Box>
);

export default SectionNavList;
