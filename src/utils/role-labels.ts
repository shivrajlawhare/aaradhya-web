import { Role } from '../contract';

// Display names for the stored Role enum values (CR-1 D11). The enum values
// themselves are unchanged — only what users read.
export const ROLE_LABELS: Record<Role, string> = {
  [Role.EventManager]: 'Event Manager',
  [Role.FnBHead]: 'F&B Head',
  [Role.Housekeeping]: 'Housekeeping',
  [Role.Reception]: 'Reception',
};

export const getRoleLabel = (role: Role) => ROLE_LABELS[role];
