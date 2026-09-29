import { describe, expect, it } from 'vitest';
import { resolveEventManagerName } from '../../src/components/ui/use-event-manager-name';

describe('resolveEventManagerName', () => {
  const namesById = new Map([['manager-1', 'Priya Joshi']]);

  it('maps a manager id to the name from GET /event-managers', () => {
    expect(resolveEventManagerName(namesById, 'manager-1')).toBe('Priya Joshi');
  });

  it('falls back to the id when the name is unknown (still loading, or the account is gone)', () => {
    expect(resolveEventManagerName(namesById, 'manager-9')).toBe('manager-9');
    expect(resolveEventManagerName(new Map(), 'manager-1')).toBe('manager-1');
  });
});
