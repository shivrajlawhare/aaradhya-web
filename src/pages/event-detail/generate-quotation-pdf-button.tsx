import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { Alert, Button, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { z } from 'zod';
import type { filteredEventResultSchema } from '../../contract';
import { useQuotationPdfDownload } from './use-quotation-pdf-download';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;

interface GenerateQuotationPdfButtonProps {
  event: PublicEvent;
}

// The Event Detail Review tab's "Generate Quotation PDF" button, rendered
// only from that tab's Event Manager branch. The Quotation Preview's "Share
// PDF" shares the same flow via useQuotationPdfDownload.
const GenerateQuotationPdfButton = ({ event }: GenerateQuotationPdfButtonProps) => {
  const { download, isFetching, error } = useQuotationPdfDownload(event);
  const theme = useTheme();
  const size = useMediaQuery(theme.breakpoints.up('md')) ? 'medium' : 'large';

  return (
    <>
      {error && (
        <Alert severity="error">
          <Typography variant="bodyM">{error}</Typography>
        </Alert>
      )}
      <Button
        variant="contained"
        size={size}
        fullWidth
        startIcon={<PictureAsPdfOutlinedIcon />}
        onClick={download}
        loading={isFetching}
      >
        Generate Quotation PDF
      </Button>
    </>
  );
};

export default GenerateQuotationPdfButton;
