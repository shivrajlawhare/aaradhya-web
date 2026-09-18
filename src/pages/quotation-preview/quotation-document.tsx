import type { ReactNode } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { z } from 'zod';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import { ClientContactRole, SessionStatus, clientContactSchema, filteredSessionResultSchema } from '../../contract';
import { toDateInputValue } from '../event-detail/date-input';
import {
  formatEventDate,
  formatQuotationAmount,
  formatQuotationGenerationDate,
  formatSessionDuration,
} from '../../utils/quotation-formatting';
import {
  brandLockupStyles,
  headerRowStyles,
  markImageStyles,
  numericCellStyles,
  orgDetailsLineStyles,
  orgDetailsStyles,
  quotationDateStyles,
  rootStyles,
  rowLabelCellStyles,
  sectionHeadingStyles,
  sectionStyles,
  tableScrollStyles,
  tableStyles,
  titleRowStyles,
  titleTextStyles,
  wordmarkNameStyles,
  wordmarkTaglineStyles,
} from './quotation-document.styles';

// The org's own real, static letterhead details (SRS §4.7a) — identical on
// every generated Quotation regardless of Event, same reasoning
// aaradhya-api's own quotation-pdf.ts TERMS_AND_CONDITIONS/BANK_ACCOUNT_
// DETAILS constants already apply to the static footer (STORY-073's own
// territory). Sourced from example_quatation_1.pdf/example_quatation_2.pdf
// (docs/example_quatations) rather than invented.
const ORG_GST_NUMBER = '27ABLFA0695F1ZC';
const ORG_ADDRESS_LINES = ['Mumbai-Goa Highway, Akeri,', 'Maharashtra – 416510'];
const ORG_CONTACT = '+91 9423362122';

// "Point of Contact", not the raw enum value "POC" — the only label among
// the four that isn't already the exact display text (SRS §5.3's default
// rows). A "Custom" row has no separate stored label anywhere in the data
// model (ClientContactAttributes is name/contactNumber/role only, aaradhya-
// api's src/models/event.ts) — falling back to "Custom" itself is a known,
// pre-existing gap this story doesn't introduce or attempt to close.
const CLIENT_CONTACT_ROLE_LABELS: Record<ClientContactRole, string> = {
  [ClientContactRole.Bride]: 'Bride',
  [ClientContactRole.Groom]: 'Groom',
  [ClientContactRole.POC]: 'Point of Contact',
  [ClientContactRole.Custom]: 'Custom',
};

// Derived from the contract's own Zod schemas (typescript-rules rule 3),
// not hand-declared — matches this page's own pre-existing PublicSession
// pattern (quotation-preview-page.tsx before this story) rather than
// duplicating the shape. Picked down to just the fields this document
// actually renders; venueCost stays `.optional()` (filteredSessionResult
// Schema's own shape for a non-EventManager caller) so the "default to 0"
// judgment call lives once, here, rather than at every call site — this
// component is meant to be the one shared render tree a future server-side
// Playwright PDF render also feeds (Aaradhya_Quotation_PDF_Strategy.md §4).
export type QuotationDocumentClientContact = z.infer<typeof clientContactSchema>;

export type QuotationDocumentSession = Pick<
  z.infer<typeof filteredSessionResultSchema>,
  'id' | 'sessionType' | 'venue' | 'venueCost' | 'startDate' | 'startTime' | 'endTime' | 'pax' | 'sessionStatus'
>;

export interface QuotationDocumentProps {
  clientContacts: QuotationDocumentClientContact[];
  sessions: QuotationDocumentSession[];
  // Injectable for deterministic tests — defaults to "now" (FR-QUO-6: always
  // the current date at generation time, never the Event's own createdAt).
  quotationDate?: Date;
}

// The shared render tree for the Quotation (Aaradhya_Quotation_PDF_Strategy.md
// §4: "One React component tree renders both the on-screen Quotation
// Preview and the PDF, so there's no second template to keep in sync") —
// this story (STORY-069) covers the header through the Event Details table;
// STORY-070 through STORY-073 add the remaining sections to this same
// component as they land.
const QuotationDocument = ({ clientContacts, sessions, quotationDate = new Date() }: QuotationDocumentProps) => {
  // A Cancelled Session isn't a real, billable line on the Quotation —
  // matches this screen's own pre-existing filter (quotation-preview-page.tsx,
  // itself mirroring aaradhya-api's STORY-043 PDF renderer and STORY-041's
  // Total Cost Summary exclusion). Two-or-more Sessions sharing a date (this
  // story's own edge case, example_quatation_2.pdf's Halad+Engagement) are
  // intentionally NOT grouped here — each stays its own row, in entry order.
  const activeSessions = sessions.filter((session) => session.sessionStatus === SessionStatus.Active);

  // Extracted rather than an inline ternary in the JSX below (typescript-
  // rules rule 5) — same reasoning quotation-preview-page.tsx's own
  // accommodationSection variable already applies to its Accommodation
  // section.
  let eventDetailsSection: ReactNode;
  if (activeSessions.length === 0) {
    // No real Session data to show a table against yet (e.g. every Session
    // so far is Cancelled) — matches this screen's own pre-existing "No
    // Sessions yet." message rather than rendering a header row over an
    // empty body.
    eventDetailsSection = <Typography>No Sessions yet.</Typography>;
  } else {
    eventDetailsSection = (
      <Box sx={tableScrollStyles}>
        <Table sx={tableStyles} aria-label="Event Details">
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Event Duration</TableCell>
              <TableCell>No. Of Guests</TableCell>
              <TableCell>Venue Selected</TableCell>
              <TableCell>Selected Venue Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell sx={rowLabelCellStyles}>{session.sessionType}</TableCell>
                <TableCell>{formatEventDate(toDateInputValue(session.startDate))}</TableCell>
                <TableCell>{formatSessionDuration(session.startTime ?? '', session.endTime ?? '')}</TableCell>
                <TableCell sx={numericCellStyles}>{session.pax}</TableCell>
                <TableCell>{session.venue}</TableCell>
                <TableCell sx={numericCellStyles}>{formatQuotationAmount(session.venueCost ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }

  return (
    <Box sx={rootStyles}>
      <Box sx={headerRowStyles}>
        <Box sx={brandLockupStyles}>
          <Box component="img" src={aaradhyaMark} alt="Aaradhya" sx={markImageStyles} />
          <Box>
            <Typography sx={wordmarkNameStyles}>AARADHYA</Typography>
            <Typography sx={wordmarkTaglineStyles}>A COMPLETE DESTINATION</Typography>
          </Box>
        </Box>
        <Box sx={orgDetailsStyles}>
          <Typography component="div" sx={orgDetailsLineStyles}>
            GST No.: {ORG_GST_NUMBER}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            Address: {ORG_ADDRESS_LINES[0]}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            {ORG_ADDRESS_LINES[1]}
          </Typography>
          <Typography component="div" sx={orgDetailsLineStyles}>
            Contact: {ORG_CONTACT}
          </Typography>
        </Box>
      </Box>

      <Box sx={titleRowStyles}>
        <Typography component="h1" sx={titleTextStyles}>
          Event Quotation
        </Typography>
        <Typography sx={quotationDateStyles}>
          Quotation Date: {formatQuotationGenerationDate(quotationDate)}
        </Typography>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Client Details
        </Typography>
        <Box sx={tableScrollStyles}>
          <Table sx={tableStyles} aria-label="Client Details">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Contact Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientContacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell sx={rowLabelCellStyles}>{CLIENT_CONTACT_ROLE_LABELS[contact.role]}</TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.contactNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={sectionStyles}>
        <Typography component="h2" sx={sectionHeadingStyles}>
          Event Details
        </Typography>
        {eventDetailsSection}
      </Box>
    </Box>
  );
};

export default QuotationDocument;
