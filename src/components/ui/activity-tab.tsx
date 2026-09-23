import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import { type changeLogEntryResultSchema, SeatingArrangement } from '../../contract';
import { SEATING_ARRANGEMENT_LABELS } from '../../pages/event-detail/session-form-options';
import {
  changeListStyles,
  emptyStateStyles,
  groupDividerStyles,
  metaRowStyles,
  rowStyles,
  timestampStyles,
} from './activity-tab.styles';
import { formatRelativeTime } from './format-relative-time';

interface ActivityTabProps {
  entityType: string;
  entityId: string;
}

type ChangeLogEntry = z.infer<typeof changeLogEntryResultSchema>;

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// STORY-081 — the vocabulary of every `field` string controllers/events.ts
// actually writes today (top-level Event/Accommodation/Payment/Documents
// Checklist/Extras fields, plus the `sessions[<identity>]./items[<identity>].`
// bracket-path convention STORY-071 established for Session/Item fields) —
// maps each to a human label. An unmapped field (a future one this table
// hasn't been extended for yet) falls back to its own raw key rather than
// crashing or hiding the entry.
const TOP_LEVEL_FIELD_LABELS: Record<string, string> = {
  eventFamilyType: 'Event type',
  status: 'Status',
  eventManager: 'Event Manager',
  clientContacts: 'Client Contacts',
  foodGstRatePercent: 'Food GST %',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  roomLines: 'Room Lines',
  totalEstimatedAmount: 'Total Estimated Amount',
  advanceRequired: 'Advance Required',
  advancePaid: 'Advance Paid',
  advancePaidDate: 'Advance Paid Date',
  paymentMode: 'Payment Mode',
  decoration: 'Decoration',
  photographer: 'Photographer',
  bhatji: 'Bhatji',
  aadharCard: 'Aadhar Card',
  panCard: 'Pan Card',
  leavingBirthCertificate: 'Leaving/Birth Certificate',
  rationCard: 'Ration Card',
  passportPhotos: 'Passport Photos',
  weddingCard: 'Wedding Card',
};

const SESSION_FIELD_LABELS: Record<string, string> = {
  sessionType: 'Session type',
  venue: 'Venue',
  venueCost: 'Venue cost',
  startDate: 'Start date',
  endDate: 'End date',
  startTime: 'Start time',
  endTime: 'End time',
  pax: 'Pax',
  sessionStatus: 'Status',
  setup: 'Setup',
};

const ITEM_FIELD_LABELS: Record<string, string> = {
  mealName: 'Meal name',
  pax: 'Pax',
  costPerPlate: 'Cost per plate',
  menuItems: 'Menu items',
  eventName: 'Event name',
  venue: 'Venue',
  startTime: 'Start time',
  endTime: 'End time',
};

const SESSION_ITEM_FIELD_PATTERN = /^sessions\[(.+)\]\.items\[(.+)\]\.(.+)$/;
const SESSION_FIELD_PATTERN = /^sessions\[(.+)\]\.(.+)$/;

interface ParsedField {
  label: string;
  // The raw sub-field key (e.g. 'setup', 'menuItems', 'roomLines') — what
  // formatChangeDetail below switches on to decide whether this needs
  // compound formatting or the plain "old → new" fallback.
  subfield: string;
}

const parseField = (field: string): ParsedField => {
  const itemMatch = SESSION_ITEM_FIELD_PATTERN.exec(field);
  if (itemMatch) {
    const sessionIdentity = itemMatch[1]!;
    const itemIdentity = itemMatch[2]!;
    const subfield = itemMatch[3]!;
    const label = ITEM_FIELD_LABELS[subfield] ?? subfield;
    return { label: `${sessionIdentity} session — ${itemIdentity} — ${label}`, subfield };
  }
  const sessionMatch = SESSION_FIELD_PATTERN.exec(field);
  if (sessionMatch) {
    const sessionIdentity = sessionMatch[1]!;
    const subfield = sessionMatch[2]!;
    const label = SESSION_FIELD_LABELS[subfield] ?? subfield;
    return { label: `${sessionIdentity} session — ${label}`, subfield };
  }
  return { label: TOP_LEVEL_FIELD_LABELS[field] ?? field, subfield: field };
};

const SETUP_SUBFIELD_LABELS: Record<string, string> = {
  seating: 'Seating',
  tableCount: 'Tables',
  chairCount: 'Chairs',
  stage: 'Stage',
  buffet: 'Buffet',
  registrationDesk: 'Registration desk',
  vipSeating: 'VIP seating',
  brideGroomSeating: 'Bride/Groom seating',
  notes: 'Notes',
};

const formatSetupFieldValue = (key: string, value: unknown): string => {
  if (key === 'seating' && typeof value === 'string' && value in SEATING_ARRANGEMENT_LABELS) {
    return SEATING_ARRANGEMENT_LABELS[value as SeatingArrangement];
  }
  return formatValue(value);
};

// Lists only the Setup sub-fields that actually changed ("Seating: — → Round
// Tables, Tables: 0 → 20"), not the whole object printed twice — the
// compound-value gap this story exists to close for Setup specifically.
const formatSetupDiff = (oldValue: unknown, newValue: unknown): string => {
  const oldSetup = (oldValue ?? {}) as Record<string, unknown>;
  const newSetup = (newValue ?? {}) as Record<string, unknown>;
  const changedParts = Object.keys(SETUP_SUBFIELD_LABELS)
    .filter((key) => JSON.stringify(oldSetup[key] ?? null) !== JSON.stringify(newSetup[key] ?? null))
    .map(
      (key) =>
        `${SETUP_SUBFIELD_LABELS[key]}: ${formatSetupFieldValue(key, oldSetup[key])} → ${formatSetupFieldValue(key, newSetup[key])}`
    );
  return changedParts.length > 0 ? changedParts.join(', ') : 'No sub-fields changed';
};

// Resolves each stored Menu Item id to its real name — the second,
// independent fix for the product owner's "menu items as their object id"
// complaint (the first is the real Sessions & Items tab, STORY-079); this
// one covers the Activity trail for edits made from anywhere, including via
// the old nested-Items flow that predates STORY-078/079.
const formatMenuItemsDiff = (oldValue: unknown, newValue: unknown, menuItemsById: Map<string, string>): string => {
  const resolve = (id: unknown) => (typeof id === 'string' ? (menuItemsById.get(id) ?? id) : String(id));
  const oldNames = Array.isArray(oldValue) ? oldValue.map(resolve).join(', ') : '';
  const newNames = Array.isArray(newValue) ? newValue.map(resolve).join(', ') : '';
  return `${oldNames || '—'} → ${newNames || '—'}`;
};

// A whole-array change to roomLines is one field (buildAccommodationUpdate's
// own convention) — summarized as added/removed/edited row counts (this
// story's own "at minimum" bar; full per-row detail is a stretch goal left
// for later) rather than two raw arrays dumped side by side.
const formatRoomLinesDiff = (oldValue: unknown, newValue: unknown): string => {
  const oldLines = Array.isArray(oldValue) ? oldValue : [];
  const newLines = Array.isArray(newValue) ? newValue : [];
  const overlap = Math.min(oldLines.length, newLines.length);
  let edited = 0;
  for (let index = 0; index < overlap; index += 1) {
    if (JSON.stringify(oldLines[index]) !== JSON.stringify(newLines[index])) {
      edited += 1;
    }
  }
  const added = Math.max(0, newLines.length - oldLines.length);
  const removed = Math.max(0, oldLines.length - newLines.length);
  const parts = [
    added > 0 ? `${added} added` : null,
    removed > 0 ? `${removed} removed` : null,
    edited > 0 ? `${edited} edited` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0
    ? `${oldLines.length} → ${newLines.length} room lines (${parts.join(', ')})`
    : `${newLines.length} room lines`;
};

const formatChangeDetail = (parsed: ParsedField, entry: ChangeLogEntry, menuItemsById: Map<string, string>): string => {
  if (parsed.subfield === 'setup') {
    return formatSetupDiff(entry.oldValue, entry.newValue);
  }
  if (parsed.subfield === 'menuItems') {
    return formatMenuItemsDiff(entry.oldValue, entry.newValue, menuItemsById);
  }
  if (parsed.subfield === 'roomLines') {
    return formatRoomLinesDiff(entry.oldValue, entry.newValue);
  }
  return `${formatValue(entry.oldValue)} → ${formatValue(entry.newValue)}`;
};

interface DisplayGroup {
  key: string;
  entries: ChangeLogEntry[];
  changedBy: string;
  timestamp: string;
}

// Groups every entry one PATCH request wrote (STORY-081's own `groupId`)
// into one visual block. An entry with no groupId (written before this
// field existed) gets a synthetic one-off key from its own id, so it always
// renders as its own single-item group rather than merging with an
// unrelated neighbor that also happens to lack a groupId.
const buildGroups = (entries: ChangeLogEntry[]): DisplayGroup[] => {
  const groups: DisplayGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.groupId ?? `entry:${entry.id}`;
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, groups.length);
      groups.push({ key, entries: [entry], changedBy: entry.changedBy, timestamp: entry.timestamp });
    } else {
      groups[existingIndex]!.entries.push(entry);
    }
  }
  return groups;
};

const ActivityTab = ({ entityType, entityId }: ActivityTabProps) => {
  const activityQuery = tsr.listChangeLog.useQuery({
    queryKey: ['change-log', entityType, entityId],
    queryData: { query: { entityType, entityId } },
  });
  // EventManager-only, matching this tab's own existing EventManager-only
  // visibility (event-detail-page.tsx's canSeeActivity) — no new privacy
  // exposure from resolving changedBy to a name here.
  const usersQuery = tsr.listUsers.useQuery({ queryKey: ['users'] });
  const userNameById = new Map((usersQuery.data?.body ?? []).map((user) => [user.id, user.name]));
  const resolveChangedBy = (userId: string): string => userNameById.get(userId) ?? userId;

  const menuItemsQuery = tsr.listMenuItems.useQuery({ queryKey: ['menu-items'], queryData: { query: {} } });
  const menuItemsById = new Map((menuItemsQuery.data?.body ?? []).map((menuItem) => [menuItem.id, menuItem.name]));

  const entries = activityQuery.data?.body ?? [];
  const groups = buildGroups(entries);

  if (activityQuery.isPending) {
    return (
      <Paper>
        <Box sx={emptyStateStyles}>
          <CircularProgress aria-label="Loading activity" size={24} />
        </Box>
      </Paper>
    );
  }

  if (groups.length === 0) {
    return (
      <Paper>
        <Box sx={emptyStateStyles}>
          <Typography variant="bodyM">No changes yet</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper>
      <Stack>
        {groups.map((group, index) => (
          <Stack key={group.key} sx={index < groups.length - 1 ? groupDividerStyles : rowStyles}>
            <Box sx={metaRowStyles}>
              <Typography variant="bodyM">{resolveChangedBy(group.changedBy)}</Typography>
              <Typography variant="bodyM" sx={timestampStyles}>
                {formatRelativeTime(new Date(group.timestamp))}
              </Typography>
            </Box>
            <Box component="ul" sx={changeListStyles}>
              {group.entries.map((entry) => {
                const parsed = parseField(entry.field);
                return (
                  <Typography key={entry.id} component="li" variant="bodyM">
                    {parsed.label}: {formatChangeDetail(parsed, entry, menuItemsById)}
                  </Typography>
                );
              })}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

export default ActivityTab;
