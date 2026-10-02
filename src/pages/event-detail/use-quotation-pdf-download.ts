import { useState } from 'react';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { filteredEventResultSchema } from '../../contract';

type QuotationPdfEvent = Pick<z.infer<typeof filteredEventResultSchema>, 'id' | 'eventId'>;

// Fetches the Event's server-rendered Quotation PDF and downloads it. Shared
// by the Event Detail "Generate Quotation PDF" button and the Quotation
// Preview toolbar's "Share PDF" — the same flow, two presentations.
export const useQuotationPdfDownload = (event: QuotationPdfEvent) => {
  const [error, setError] = useState<string | null>(null);

  // enabled: false — a GET triggered on demand via refetch().
  const pdfQuery = tsr.getQuotationPdf.useQuery({
    queryKey: ['quotation-pdf', event.id],
    queryData: { params: { id: event.id } },
    enabled: false,
    retry: false,
  });

  const download = async () => {
    // A double tap while a render is in flight must not fire a second one.
    if (pdfQuery.isFetching) {
      return;
    }
    setError(null);

    const result = await pdfQuery.refetch();
    if (result.isError || !result.data || result.data.status !== 200) {
      setError('Something went wrong. Please try again.');
      return;
    }

    // A download link rather than a new tab: a window opened after this
    // async gap is outside the click's user gesture, so browsers may block
    // it; a download has no such restriction.
    const url = URL.createObjectURL(result.data.body);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.eventId}-quotation.pdf`;
    link.click();
    // Deferred: some browsers need a moment to start reading the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return { download, isFetching: pdfQuery.isFetching, error };
};
