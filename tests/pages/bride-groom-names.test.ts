import { describe, expect, it } from 'vitest';
import { ClientContactRole } from '../../src/contract';
import { getBrideGroomNames } from '../../src/pages/event-list/events-table';

const contact = (role: ClientContactRole, name: string) => ({ role, name, contactNumber: '' });

describe('getBrideGroomNames (DEV-16 QA)', () => {
  it('joins both names', () => {
    expect(
      getBrideGroomNames([contact(ClientContactRole.Bride, 'Sneha'), contact(ClientContactRole.Groom, 'Rohan')])
    ).toBe('Sneha & Rohan');
  });

  it('shows "—" rather than a lone "&" when the Bride/Groom rows have no names', () => {
    expect(getBrideGroomNames([contact(ClientContactRole.Bride, ''), contact(ClientContactRole.Groom, '  ')])).toBe(
      '—'
    );
  });

  it('shows just the one name that is filled in', () => {
    expect(getBrideGroomNames([contact(ClientContactRole.Bride, ''), contact(ClientContactRole.Groom, 'Rohan')])).toBe(
      'Rohan'
    );
  });
});
