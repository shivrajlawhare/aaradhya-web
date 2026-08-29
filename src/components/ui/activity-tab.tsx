import type { ReactNode } from 'react';
import { Box, CircularProgress, List, ListItem, Paper, Typography } from '@mui/material';
import { tsr } from '../../api/client';
import { formatRelativeTime } from './format-relative-time';
import { emptyStateStyles, metaRowStyles, rowStyles, timestampStyles } from './activity-tab.styles';

interface ActivityTabProps {
  entityType: string;
  entityId: string;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// changedBy is the User id, not a name — STORY-008/STORY-009 deliberately
// kept it a plain string with no ref/populate on the backend. A later story
// can resolve it to a display name once the API returns one; this component
// renders whatever it's given.
const ActivityTab = ({ entityType, entityId }: ActivityTabProps) => {
  const activityQuery = tsr.listChangeLog.useQuery({
    queryKey: ['change-log', entityType, entityId],
    queryData: { query: { entityType, entityId } },
  });

  const entries = activityQuery.data?.body ?? [];

  let content: ReactNode;
  if (activityQuery.isPending) {
    content = (
      <Box sx={emptyStateStyles}>
        <CircularProgress aria-label="Loading activity" size={24} />
      </Box>
    );
  } else if (entries.length === 0) {
    content = (
      <Box sx={emptyStateStyles}>
        <Typography variant="bodyM">No changes yet</Typography>
      </Box>
    );
  } else {
    content = (
      <List disablePadding>
        {entries.map((entry) => (
          <ListItem key={entry.id} divider sx={rowStyles}>
            <Typography variant="bodyM">
              {entry.field}: {formatValue(entry.oldValue)} → {formatValue(entry.newValue)}
            </Typography>
            <Box sx={metaRowStyles}>
              <Typography variant="bodyM">{entry.changedBy}</Typography>
              <Typography variant="bodyM" sx={timestampStyles}>
                {formatRelativeTime(new Date(entry.timestamp))}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    );
  }

  return <Paper>{content}</Paper>;
};

export default ActivityTab;
