import { Box, Typography } from '@mui/material';
import { visuallyHiddenStyles } from '../../components/ui/visually-hidden.styles';
import { labelStyles, type StepStatus, visibleLabelStyles } from './wizard-stepper.styles';

interface StepLabelProps {
  number: number;
  label: string;
  status: StepStatus;
}

// A wizard step's name as the stepper and the "What's next" helper show it:
// the number sits in the marker, so the label reads "Accommodation" on
// screen and "3. Accommodation" to assistive tech.
const StepLabel = ({ number, label, status }: StepLabelProps) => (
  <Typography component="span" sx={labelStyles(status)}>
    <Box component="span" sx={visuallyHiddenStyles}>
      {`${number}. ${label}`}
    </Box>
    <Box component="span" aria-hidden data-label={label} sx={visibleLabelStyles} />
  </Typography>
);

export default StepLabel;
