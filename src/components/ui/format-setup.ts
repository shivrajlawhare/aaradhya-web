import type { z } from 'zod';
import type { sessionSetupResultSchema } from '../../contract';

type SessionSetup = z.infer<typeof sessionSetupResultSchema>;

// "Theatre, 10T/100C, Stage, Buffet" — active flags only, joined with the
// seating arrangement and table/chair counts. "—" when a role permitted to
// see Setup at all still has no setup configured for this session (every
// field still at its schema default). Shared by the Dashboard's
// upcoming-events-table.tsx (STORY-050) and the Event Detail Sessions tab
// (STORY-052) — both display the exact same sessionSetupResultSchema shape,
// extracted here once the second real caller needed the identical format.
export const formatSetup = (setup: SessionSetup | undefined): string => {
  if (!setup) {
    return '—';
  }
  const parts: string[] = [];
  if (setup.seating) {
    parts.push(setup.seating);
  }
  if (setup.tableCount > 0 || setup.chairCount > 0) {
    parts.push(`${setup.tableCount}T/${setup.chairCount}C`);
  }
  if (setup.stage) {
    parts.push('Stage');
  }
  if (setup.buffet) {
    parts.push('Buffet');
  }
  if (setup.registrationDesk) {
    parts.push('Registration desk');
  }
  if (setup.vipSeating) {
    parts.push('VIP seating');
  }
  if (setup.brideGroomSeating) {
    parts.push('Bride/Groom seating');
  }

  return parts.length > 0 ? parts.join(', ') : '—';
};
