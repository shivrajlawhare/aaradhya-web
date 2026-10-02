import { Alert, Button, Typography } from '@mui/material';
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

  return (
    <>
      {error && (
        <Alert severity="error">
          <Typography variant="bodyM">{error}</Typography>
        </Alert>
      )}
      <Button variant="contained" onClick={download} disabled={isFetching}>
        <Typography variant="labelS" component="span">
          Generate Quotation PDF
        </Typography>
      </Button>
    </>
  );
};

export default GenerateQuotationPdfButton;
