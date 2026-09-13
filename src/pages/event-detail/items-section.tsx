import { useState } from 'react';
import { Button, Divider, Stack, Typography } from '@mui/material';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import type { filteredEventResultSchema } from '../../contract';
import ItemCard from './item-card';
import { sectionStyles } from './items-section.styles';

type PublicEvent = z.infer<typeof filteredEventResultSchema>;
type SessionResult = PublicEvent['sessions'][number];

interface ItemsSectionProps {
  eventId: string;
  session: SessionResult;
  // Refetches the whole Event so session.items (and this section's own
  // menu-item lookups) reflect whatever the server now has — the same
  // "parent owns the refetch" convention every other tab/form on this
  // page already uses.
  onItemsChanged: () => void;
}

const ItemsSection = ({ eventId, session, onItemsChanged }: ItemsSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);

  // The full Menu Item master list, fetched once here rather than
  // per-keystroke — see menu-item-search.tsx for why. Aaradhya's own
  // master list is small at its stated scale (~15 users, one property).
  const menuItemsQuery = tsr.listMenuItems.useQuery({
    queryKey: ['menu-items'],
    queryData: { query: {} },
  });
  const menuItemOptions = (menuItemsQuery.data?.body ?? []).map((menuItem) => ({
    id: menuItem.id,
    name: menuItem.name,
  }));
  const menuItemsById = new Map(menuItemOptions.map((option) => [option.id, option.name]));
  // This section is only ever rendered from SessionForm's edit mode (Event
  // Manager, whose sessions always have `items` present unfiltered) — the
  // `?? []` fallback exists purely to satisfy `items`' now-`.optional()`
  // type (STORY-052's filteredSessionResultSchema).
  const items = session.items ?? [];

  return (
    <Stack sx={sectionStyles}>
      <Typography variant="titleM" component="h3">
        Items
      </Typography>
      {items.map((item, index) => (
        <Stack key={item.id}>
          {index > 0 && <Divider />}
          <ItemCard
            eventId={eventId}
            sessionId={session.id}
            index={index + 1}
            item={item}
            menuItemOptions={menuItemOptions}
            menuItemsById={menuItemsById}
            onChanged={onItemsChanged}
            onDiscardNew={() => {
              // Unreachable for an existing item — ItemCard only calls
              // onDiscardNew when its own `item` prop is absent.
            }}
          />
        </Stack>
      ))}
      {isAddingNew && (
        <Stack>
          {items.length > 0 && <Divider />}
          <ItemCard
            eventId={eventId}
            sessionId={session.id}
            index={items.length + 1}
            menuItemOptions={menuItemOptions}
            menuItemsById={menuItemsById}
            onChanged={() => {
              setIsAddingNew(false);
              onItemsChanged();
            }}
            onDiscardNew={() => setIsAddingNew(false)}
          />
        </Stack>
      )}
      {!isAddingNew && (
        <Button variant="contained" onClick={() => setIsAddingNew(true)}>
          Add Item
        </Button>
      )}
    </Stack>
  );
};

export default ItemsSection;
