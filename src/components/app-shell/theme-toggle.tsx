import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Box, ButtonBase, Typography, useColorScheme } from '@mui/material';
import { toggleKnobStyles, toggleSegmentStyles, toggleTrackStyles } from './theme-toggle.styles';

// Light / Dark switch in the nav footer (the redesign's one approved new
// control). setMode persists the choice through AppThemeProvider.
const ThemeToggle = () => {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === 'dark';

  return (
    <Box role="radiogroup" aria-label="Theme" sx={toggleTrackStyles}>
      <Box aria-hidden sx={toggleKnobStyles(isDark)} />
      <ButtonBase
        role="radio"
        aria-checked={!isDark}
        onClick={() => setMode('light')}
        sx={toggleSegmentStyles(!isDark)}
      >
        <LightModeOutlinedIcon />
        <Typography variant="labelM" component="span">
          Light
        </Typography>
      </ButtonBase>
      <ButtonBase role="radio" aria-checked={isDark} onClick={() => setMode('dark')} sx={toggleSegmentStyles(isDark)}>
        <DarkModeOutlinedIcon />
        <Typography variant="labelM" component="span">
          Dark
        </Typography>
      </ButtonBase>
    </Box>
  );
};

export default ThemeToggle;
