// "1. Tea", "2. Coffee" — a menu chip's visible label in list order (R1,
// UI Redesign 5C.3). Display only: the stored menu items stay names / ids.
export const formatNumberedMenuItem = (name: string, index: number): string => `${index + 1}. ${name}`;
