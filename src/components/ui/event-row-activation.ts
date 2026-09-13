import type { KeyboardEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { eventDetailPath } from '../../routes';

// Shared by events-table.tsx (STORY-016) and the Dashboard's
// upcoming-events-table.tsx (STORY-048) — extracted here once a second
// real caller needed the exact same "click or Enter/Space activates the
// row, navigating to that Event's detail screen" behavior. Returns plain
// event-handler props, not a hook — called once per row inside a `.map()`,
// where a custom hook would violate the Rules of Hooks (a variable number
// of hook calls per render).
export const createEventRowActivation = (navigate: NavigateFunction, eventId: string) => {
  const activate = () => navigate(eventDetailPath(eventId));

  return {
    onClick: activate,
    onKeyDown: (keyboardEvent: KeyboardEvent<HTMLTableRowElement>) => {
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        keyboardEvent.preventDefault();
        activate();
      }
    },
  };
};
