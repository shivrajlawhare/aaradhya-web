// Grouped digits for a plain money amount (this story's own edge case: a
// Grand Total large enough to need thousands-grouping must render
// correctly, not as a raw digit string). 'en-IN' groups in the lakh/crore
// style (Aaradhya is an Indian event-management domain) rather than
// 'en-US' 3-digit groups — no currency symbol, since neither the SRS nor
// the theme tokens name one.
export const formatAmount = (amount: number): string => new Intl.NumberFormat('en-IN').format(amount);

// "₹ 1,05,840" — the wizard's Accommodation money cells and totals (Figma
// 05 New Event / 3 Accommodation, DEV-07).
export const formatRupees = (amount: number): string => `₹ ${formatAmount(amount)}`;
