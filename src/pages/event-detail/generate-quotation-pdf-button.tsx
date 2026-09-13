import { useState } from 'react';
import { Alert, Button, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { eventResultSchema } from '../../contract';

type PublicEvent = z.infer<typeof eventResultSchema>;

interface GenerateQuotationPdfButtonProps {
  event: PublicEvent;
  // STORY-045's Quotation Preview screen reuses this exact component under
  // a different label ("Share PDF") — its own AC: "triggers the same flow
  // as STORY-044," not a separate implementation. Defaults to this story's
  // own label so every other caller is unaffected.
  label?: string;
}

// Rendered only from inside overview-tab.tsx's own canEdit branch (this
// story's own AC: "visible only on the Event Manager's view of the
// Overview tab") — no canEdit prop needed here, the parent decides whether
// to mount this component at all. STORY-052 will later re-check the
// Overview tab's own visibility per role, the same flag this story's AC
// names; nothing here needs to change for that, since this button's
// visibility is entirely inherited from wherever the tab itself renders.
const GenerateQuotationPdfButton = ({ event, label = 'Generate Quotation PDF' }: GenerateQuotationPdfButtonProps) => {
  const [error, setError] = useState<string | null>(null);

  // enabled: false — this is a GET, so there's no useMutation; the button
  // triggers the same query on demand via refetch(), the same shape
  // total-cost-summary-panel.tsx's own refetch() call already uses.
  const pdfQuery = tsr.getQuotationPdf.useQuery({
    queryKey: ['quotation-pdf', event.id],
    queryData: { params: { id: event.id } },
    enabled: false,
    retry: false,
  });

  const handleGenerate = async () => {
    // Re-entrancy guard — a double-tap while a generation is already in
    // flight must not fire a second request (this story's own edge case),
    // same shape every other Save button's own `isPending` guard uses.
    if (pdfQuery.isFetching) {
      return;
    }
    setError(null);

    const result = await pdfQuery.refetch();
    if (result.isError || !result.data || result.data.status !== 200) {
      setError('Something went wrong. Please try again.');
      return;
    }

    // Downloads rather than opening a new tab — no popup-blocker risk (a
    // window opened after this async gap is no longer inside the click's
    // own user-gesture window, so browsers can silently block it — a
    // download link has no such restriction) and it satisfies the AC's
    // "opens or downloads... without a full page navigation" either way.
    const url = URL.createObjectURL(result.data.body);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.eventId}-quotation.pdf`;
    link.click();
    // Deferred, not immediate — some browsers need a moment to start
    // reading the blob before the object URL is safe to revoke.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      {error && (
        <Alert severity="error">
          <Typography variant="bodyM">{error}</Typography>
        </Alert>
      )}
      <Button variant="contained" onClick={handleGenerate} disabled={pdfQuery.isFetching}>
        <Typography variant="labelS" component="span">
          {label}
        </Typography>
      </Button>
    </>
  );
};

export default GenerateQuotationPdfButton;
