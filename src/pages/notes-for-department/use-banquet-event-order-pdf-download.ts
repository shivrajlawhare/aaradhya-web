import { useState } from 'react';
import { tsr } from '../../api/client';
import { downloadBlob } from '../../utils/download-blob';

interface BanquetEventOrderPdfEvent {
  id: string;
  eventId: string;
}

const PDF_ERROR = 'Something went wrong. Please try again.';

// Fetches the server-rendered Notes for Department PDF and saves it as
// `<eventId>-notes-for-department.pdf` — any role may (DEV-12).
export const useBanquetEventOrderPdfDownload = (event: BanquetEventOrderPdfEvent) => {
  const [error, setError] = useState<string | null>(null);

  // enabled: false — a GET triggered on demand via refetch().
  const pdfQuery = tsr.getBanquetEventOrderPdf.useQuery({
    queryKey: ['banquet-event-order-pdf', event.id],
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
      setError(PDF_ERROR);
      return;
    }
    downloadBlob(result.data.body, `${event.eventId}-notes-for-department.pdf`);
  };

  return { download, isFetching: pdfQuery.isFetching, error };
};
