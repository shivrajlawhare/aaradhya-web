// Saves a fetched file. A download link rather than a new tab: a window
// opened after an async gap is outside the click's user gesture, so browsers
// may block it; a download has no such restriction. Shared by the Quotation
// and Notes for Department PDFs.
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Deferred: some browsers need a moment to start reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
