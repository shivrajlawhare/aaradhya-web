import { describe, expect, it } from 'vitest';
import { Role } from '../../src/contract';
import { getRoleLabel } from '../../src/utils/role-labels';

describe('getRoleLabel', () => {
  it.each([
    [Role.EventManager, 'Event Manager'],
    [Role.FnBHead, 'F&B Head'],
    [Role.Housekeeping, 'Housekeeping'],
    [Role.Reception, 'Reception'],
  ])('labels %s as "%s"', (role, label) => {
    expect(getRoleLabel(role)).toBe(label);
  });
});
